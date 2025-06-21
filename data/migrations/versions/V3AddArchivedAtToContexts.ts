import { Context } from '@/data/documentTypes/Context';
import { MigrationsDoc } from '@/data/documentTypes/MigrationsDoc';
import { Migration } from '../Migration';

class V3AddArchivedAtToContexts implements Migration {
  getVersion(): number {
    return 3;
  }

  async needsMigration(db: PouchDB.Database): Promise<boolean> {
    const migrations = await db.get<MigrationsDoc>('migrations');
    return !(migrations && migrations.version >= this.getVersion());
  }

  async up(db: PouchDB.Database): Promise<void> {
    const contexts = await db.allDocs<Context>({
      include_docs: true,
      startkey: 'context-',
    });

    const updatedContexts = contexts.rows.map((row) => {
      const context = row.doc as Context;
      context.deletedAt = null;
      return context;
    });

    await db.bulkDocs(updatedContexts);

    // Update the migrations document to reflect the new version
    const migrationsDoc = await db.get<MigrationsDoc>('migrations');
    migrationsDoc.version = 3;
    await db.put(migrationsDoc);
  }
}

export default V3AddArchivedAtToContexts;
