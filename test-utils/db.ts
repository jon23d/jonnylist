import PouchDB from 'pouchdb';
import InMemoryAdapter from 'pouchdb-adapter-memory';
import { DataSource } from '@/data/DataSource';
import { DocumentTypes } from '@/data/documentTypes';
import { Logger } from '@/helpers/Logger';

PouchDB.plugin(InMemoryAdapter);

export function createTestDataSource(): {
  dataSource: DataSource;
  database: PouchDB.Database<DocumentTypes>;
} {
  const dbName = `test_db_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const database = new PouchDB<DocumentTypes>(dbName, { adapter: 'memory' });

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
    try {
      await dataSource.cleanup();
    } catch (error) {
      Logger.error('Error during cleanup:', error);
    }
  });

  // Return getters so tests can access current instances
  return {
    getDataSource: () => dataSource,
    getDb: () => db,
  };
}
