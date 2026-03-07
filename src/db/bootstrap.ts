import { db } from './db';
import { seedDatabase } from './seeds';

export const initializeDatabase = async (): Promise<void> => {
  await db.open();
  await seedDatabase();
};
