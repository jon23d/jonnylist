import PouchDB from 'pouchdb';
import { DocumentTypes } from '@/data/documentTypes';
import { LocalDataSource } from '@/data/LocalDataSource';

export function createTestLocalDataSource(): {
  dataSource: LocalDataSource;
  database: PouchDB.Database<DocumentTypes>;
} {
  const dbName = `test_db_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const database = new PouchDB<DocumentTypes>(dbName);

  const dataSource = new LocalDataSource(database);

  return { dataSource, database };
}
