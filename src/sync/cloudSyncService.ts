import type { User } from '@supabase/supabase-js';
import { exportDataBundle, importDataBundle, saveMeta, type ImportStrategy } from '@/db/repository';
import { getDeviceId } from '@/shared/utils/device';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import type { CloudBackupRow, CloudSyncResult } from './types';

const CLOUD_BACKUP_TABLE = 'cloud_backups';

const now = (): string => new Date().toISOString();
const hashString = (value: string): string => {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
};
const createFingerprint = (value: unknown): string => hashString(JSON.stringify(value));

const isFirstCloudSyncAttempt = (payload: Awaited<ReturnType<typeof exportDataBundle>>): boolean => {
  const metaKeys = new Set(payload.data.meta.map((item) => item.key));
  return !metaKeys.has('lastCloudPushAt') && !metaKeys.has('lastCloudPullAt') && !metaKeys.has('lastCloudSyncAt');
};

const isLikelyEmptyLocalData = (payload: Awaited<ReturnType<typeof exportDataBundle>>): boolean => {
  return (
    payload.data.persons.length === 0 &&
    payload.data.accounts.length === 0 &&
    payload.data.cards.length === 0 &&
    payload.data.transactions.length === 0 &&
    payload.data.budgets.length === 0
  );
};

const isLikelyLegacyDemoSeed = (payload: Awaited<ReturnType<typeof exportDataBundle>>): boolean => {
  const peopleNames = new Set(payload.data.persons.map((person) => person.nome.trim().toLowerCase()));
  const hasDemoPeople = peopleNames.has('pessoa 1') && peopleNames.has('pessoa 2');
  const hasDemoTransactions = payload.data.transactions.some((transaction) =>
    ['salário principal', 'projeto freelancer', 'compra do mês', 'abastecimento'].includes(
      transaction.descricao.trim().toLowerCase()
    )
  );

  return hasDemoPeople && hasDemoTransactions;
};

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

const getMetaValue = (
  payload: Awaited<ReturnType<typeof exportDataBundle>>,
  key: string
): string | undefined => {
  return payload.data.meta.find((item) => item.key === key)?.value;
};

const trackFingerprints = async (localFingerprint: string, remoteFingerprint: string): Promise<void> => {
  await trackCloudMeta('lastCloudLocalFingerprint', localFingerprint);
  await trackCloudMeta('lastCloudRemoteFingerprint', remoteFingerprint);
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
    const localBeforeFingerprint = createFingerprint(localBeforeMerge.data);
    const currentDeviceId = getDeviceId();
    const shouldPullRemote = Boolean(latestBefore && latestBefore.device_id !== currentDeviceId);
    const remoteFingerprint = latestBefore ? createFingerprint(latestBefore.payload.data) : '';
    const previousLocalFingerprint = getMetaValue(localBeforeMerge, 'lastCloudLocalFingerprint');
    const previousRemoteFingerprint = getMetaValue(localBeforeMerge, 'lastCloudRemoteFingerprint');
    const localChangedSinceLastSync = Boolean(
      previousLocalFingerprint && previousLocalFingerprint !== localBeforeFingerprint
    );
    const remoteChangedSinceLastSync = Boolean(
      latestBefore &&
      (!previousRemoteFingerprint || previousRemoteFingerprint !== remoteFingerprint)
    );
    const shouldReplaceLocalWithRemote =
      shouldPullRemote &&
      Boolean(latestBefore) &&
      isFirstCloudSyncAttempt(localBeforeMerge) &&
      (isLikelyEmptyLocalData(localBeforeMerge) || isLikelyLegacyDemoSeed(localBeforeMerge));

    if (shouldPullRemote && latestBefore && shouldReplaceLocalWithRemote) {
      await importDataBundle(latestBefore.payload, 'overwrite');
      await trackCloudMeta('lastCloudPullAt', now());
      await trackCloudMeta('lastCloudSyncAt', now());
      await trackFingerprints(remoteFingerprint, remoteFingerprint);

      return {
        pulled: true,
        pushed: false,
        latestRemoteAt: latestBefore.created_at,
      };
    }

    if (latestBefore && shouldPullRemote && remoteChangedSinceLastSync && !localChangedSinceLastSync) {
      await importDataBundle(latestBefore.payload, 'overwrite');
      await trackCloudMeta('lastCloudPullAt', now());
      await trackCloudMeta('lastCloudSyncAt', now());
      await trackFingerprints(remoteFingerprint, remoteFingerprint);

      return {
        pulled: true,
        pushed: false,
        latestRemoteAt: latestBefore.created_at,
      };
    }

    if (latestBefore && shouldPullRemote && remoteChangedSinceLastSync && localChangedSinceLastSync) {
      await importDataBundle(latestBefore.payload, 'merge');
      await trackCloudMeta('lastCloudPullAt', now());

      const mergedBundle = await exportDataBundle();
      const mergedFingerprint = createFingerprint(mergedBundle.data);
      const uploaded = await cloudBackupService.uploadBundle(mergedBundle, 'sync-merge');
      await trackCloudMeta('lastCloudSyncAt', now());
      await trackFingerprints(mergedFingerprint, mergedFingerprint);

      return {
        pulled: true,
        pushed: true,
        latestRemoteAt: latestBefore.created_at,
        uploadedAt: uploaded.created_at,
      };
    }

    if (latestBefore && remoteFingerprint === localBeforeFingerprint) {
      await trackCloudMeta('lastCloudSyncAt', now());
      await trackFingerprints(localBeforeFingerprint, remoteFingerprint);
      return {
        pulled: false,
        pushed: false,
        latestRemoteAt: latestBefore.created_at,
      };
    }

    if (!latestBefore && isLikelyEmptyLocalData(localBeforeMerge)) {
      await trackCloudMeta('lastCloudSyncAt', now());
      await trackFingerprints(localBeforeFingerprint, localBeforeFingerprint);
      return {
        pulled: false,
        pushed: false,
      };
    }

    const uploaded = await cloudBackupService.uploadBundle(localBeforeMerge, 'sync-now');
    await trackCloudMeta('lastCloudSyncAt', now());
    await trackFingerprints(localBeforeFingerprint, localBeforeFingerprint);

    return {
      pulled: false,
      pushed: true,
      latestRemoteAt: latestBefore?.created_at,
      uploadedAt: uploaded.created_at,
    };
  },
};
