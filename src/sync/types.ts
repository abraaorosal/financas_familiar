import type { DataBundle } from '@/domain/models';

export interface CloudBackupRow {
  id: string;
  user_id: string;
  label: string;
  device_id: string;
  payload: DataBundle;
  created_at: string;
}

export interface CloudSyncResult {
  pulled: boolean;
  pushed: boolean;
  latestRemoteAt?: string;
  uploadedAt?: string;
}
