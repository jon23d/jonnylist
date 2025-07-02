import PouchDB from 'pouchdb';
import { DataSource } from '@/data/DataSource';
import { DocumentTypes } from '@/data/documentTypes';

export function createTestDataSource(): {
  dataSource: DataSource;
  database: PouchDB.Database<DocumentTypes>;
} {
  const dbName = `test_db_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const database = new PouchDB<DocumentTypes>(dbName);

  const dataSource = new DataSource(database);

  return { dataSource, database };
}

export function setupTestDatabase(): {
  getDataSource: () => DataSource;
  getDb: () => PouchDB.Database<DocumentTypes>;
} {
  let dataSource: DataSource;
  let db: PouchDB.Database<DocumentTypes>;

  beforeEach(() => {
    const testData = createTestDataSource();
    dataSource = testData.dataSource;
    db = testData.database;
  });

  afterEach(async () => {
    await dataSource.cleanup();
    await db.destroy();
  });

  // Return getters so tests can access current instances
  return {
    getDataSource: () => dataSource,
    getDb: () => db,
  };
}
