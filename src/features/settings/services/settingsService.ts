import { clearAllData, exportDataBundle, importDataBundle, removePerson, upsertPerson } from '@/db/repository';

export const settingsService = {
  exportDataBundle,
  importDataBundle,
  clearAllData,
  upsertPerson,
  removePerson,
};
