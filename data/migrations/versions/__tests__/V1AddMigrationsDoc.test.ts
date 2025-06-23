import V1AddMigrationsDoc from '@/data/migrations/versions/V1AddMigrationsDoc';
import { setupTestDatabase } from '@/test-utils/db';

describe('V1AddMigrations', () => {
  const { getDb } = setupTestDatabase();
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('needsMigration should return true if no migrations doc exists', async () => {
    const db = getDb();

    const migration = new V1AddMigrationsDoc();

    const needsMigration = await migration.needsMigration(db);

    expect(needsMigration).toBe(true);
  });

  test('needsMigration should return false if migrations doc exists', async () => {
    const db = getDb();

    const migration = new V1AddMigrationsDoc();
    await db.put({
      _id: 'migrations',
      version: 1,
      migrations: [''],
    });

    const needsMigration = await migration.needsMigration(db);

    expect(needsMigration).toBe(false);
  });

  test('up should create migrations doc with version 1', async () => {
    const db = getDb();
    const migration = new V1AddMigrationsDoc();

    await migration.up(db);

    const migrationsDoc: any = await db.get('migrations');
    expect(migrationsDoc._id).toBe('migrations');
    expect(migrationsDoc.version!).toBe(1);
    expect(migrationsDoc.migrations!).toEqual([]);
  });
});
