import type { User } from '@supabase/supabase-js';
import { exportDataBundle, importDataBundle, saveMeta, type ImportStrategy } from '@/db/repository';
import { getDeviceId } from '@/shared/utils/device';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import type { CloudBackupRow, CloudSyncResult } from './types';

const CLOUD_BACKUP_TABLE = 'cloud_backups';

const now = (): string => new Date().toISOString();

const ensureConfigured = (): void => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
};

const ensureUser = async (): Promise<User> => {
  ensureConfigured();
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();

  if (error) throw error;
  if (!data.user) throw new Error('Usuário não autenticado.');

  return data.user;
};

const trackCloudMeta = async (key: string, value: string): Promise<void> => {
  await saveMeta({
    key,
    value,
    updatedAt: now(),
  });
};

export const cloudAuthService = {
  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured) return null;

    const client = getSupabaseClient();
    const { data, error } = await client.auth.getUser();
    if (error) {
      if (error.message.toLowerCase().includes('auth session missing')) {
        return null;
      }
      throw error;
    }

    return data.user;
  },

  async signUp(email: string, password: string): Promise<void> {
    ensureConfigured();

    const client = getSupabaseClient();
    const { error } = await client.auth.signUp({ email, password });
    if (error) throw error;
  },

  async signIn(email: string, password: string): Promise<void> {
    ensureConfigured();

    const client = getSupabaseClient();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured) return;

    const client = getSupabaseClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },
};

const uploadBundle = async (
  payload: Awaited<ReturnType<typeof exportDataBundle>>,
  label: string
): Promise<CloudBackupRow> => {
  const user = await ensureUser();
  const client = getSupabaseClient();

  const { data, error } = await client
    .from(CLOUD_BACKUP_TABLE)
    .insert({
      user_id: user.id,
      label,
      device_id: getDeviceId(),
      payload,
    })
    .select('id,user_id,label,device_id,payload,created_at')
    .single();

  if (error) throw error;

  await trackCloudMeta('lastCloudPushAt', now());

  return data as CloudBackupRow;
};

const listBackups = async (limit = 20): Promise<CloudBackupRow[]> => {
  const user = await ensureUser();
  const client = getSupabaseClient();

  const { data, error } = await client
    .from(CLOUD_BACKUP_TABLE)
    .select('id,user_id,label,device_id,payload,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as CloudBackupRow[];
};

const getLatestBackup = async (): Promise<CloudBackupRow | null> => {
  const backups = await listBackups(1);
  return backups[0] ?? null;
};

const uploadBackup = async (label: string): Promise<CloudBackupRow> => {
  const payload = await exportDataBundle();
  return uploadBundle(payload, label);
};

const pullLatest = async (strategy: ImportStrategy): Promise<CloudBackupRow | null> => {
  const latest = await getLatestBackup();
  if (!latest) return null;

  await importDataBundle(latest.payload, strategy);
  await trackCloudMeta('lastCloudPullAt', now());

  return latest;
};

const restoreBackup = async (backupId: string, strategy: ImportStrategy): Promise<void> => {
  const user = await ensureUser();
  const client = getSupabaseClient();

  const { data, error } = await client
    .from(CLOUD_BACKUP_TABLE)
    .select('id,user_id,label,device_id,payload,created_at')
    .eq('user_id', user.id)
    .eq('id', backupId)
    .single();

  if (error) throw error;

  await importDataBundle((data as CloudBackupRow).payload, strategy);
  await uploadBackup('restore-snapshot');
  await trackCloudMeta('lastCloudRestoreAt', now());
};

export const cloudBackupService = {
  uploadBundle,
  listBackups,
  getLatestBackup,
  uploadBackup,
  pullLatest,
  restoreBackup,
};

export const cloudSyncService = {
  async syncNow(): Promise<CloudSyncResult> {
    const latestBefore = await cloudBackupService.getLatestBackup();
    const localBeforeMerge = await exportDataBundle();
    const localBeforeFingerprint = JSON.stringify(localBeforeMerge.data);
    const currentDeviceId = getDeviceId();
    const shouldPullRemote = Boolean(latestBefore && latestBefore.device_id !== currentDeviceId);

    if (
      shouldPullRemote &&
      latestBefore &&
      JSON.stringify(latestBefore.payload.data) !== localBeforeFingerprint
    ) {
      await cloudBackupService.uploadBundle(localBeforeMerge, 'pre-merge-local');
    }

    if (shouldPullRemote && latestBefore) {
      await importDataBundle(latestBefore.payload, 'merge');
      await trackCloudMeta('lastCloudPullAt', now());
    }

    const mergedBundle = await exportDataBundle();
    const remoteDataFingerprint = latestBefore ? JSON.stringify(latestBefore.payload.data) : '';
    const localDataFingerprint = JSON.stringify(mergedBundle.data);

    await trackCloudMeta('lastCloudSyncAt', now());

    if (latestBefore && remoteDataFingerprint === localDataFingerprint) {
      return {
        pulled: shouldPullRemote,
        pushed: false,
        latestRemoteAt: latestBefore.created_at,
      };
    }

    const uploaded = await cloudBackupService.uploadBackup('sync-now');

    return {
      pulled: shouldPullRemote,
      pushed: true,
      latestRemoteAt: latestBefore?.created_at,
      uploadedAt: uploaded.created_at,
    };
  },
};
