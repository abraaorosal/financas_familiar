import { createAccountTransfer, removeAccount, upsertAccount } from '@/db/repository';

export const accountService = {
  upsertAccount,
  removeAccount,
  createAccountTransfer,
};
