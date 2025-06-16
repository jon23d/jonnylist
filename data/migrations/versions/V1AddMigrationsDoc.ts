import PouchDB from 'pouchdb';
import { Migration } from '../Migration';

class V1AddMigrationsDoc implements Migration {
  getVersion(): number {
    return 1;
  }

  async needsMigration(db: PouchDB.Database): Promise<boolean> {
    try {
      await db.get('migrations');
      return false;
    } catch (err) {
      if (err instanceof Error && err.name === 'not_found') {
        return true;
      }
      throw err;
    }
  }

  async up(db: PouchDB.Database): Promise<void> {
    const migrationsDoc = {
      _id: 'migrations',
      version: 1,
      migrations: [],
    };

    await db.put(migrationsDoc);
  }
}

export default V1AddMigrationsDoc;
