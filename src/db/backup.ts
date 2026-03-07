import type { DataBundle } from '@/domain/models';
import { exportDataBundle, importDataBundle, type ImportStrategy } from './repository';

export const backupService = {
  exportData: (): Promise<DataBundle> => exportDataBundle(),
  importData: (bundle: unknown, strategy: ImportStrategy): Promise<void> => importDataBundle(bundle, strategy),
  downloadJson: (bundle: DataBundle) => {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `financas-da-casa-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};
