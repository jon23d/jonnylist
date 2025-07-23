import { MigrationsDoc } from '@/data/documentTypes/MigrationsDoc';
import { Migration } from '../Migration';

class V7AddRecurrenceIndex implements Migration {
  getVersion(): number {
    return 7;
  }

  async needsMigration(db: PouchDB.Database): Promise<boolean> {
    const migrations = await db.get<MigrationsDoc>('migrations');
    return !(migrations && migrations.version >= this.getVersion());
  }

  // TODO: Prove via automation that this works
  async up(db: PouchDB.Database): Promise<void> {
    await db.createIndex({
      index: {
        fields: ['type', 'recurrenceTemplateId'],
      },
    });

    // Update the migrations document to reflect the new version
    const migrationsDoc = await db.get<MigrationsDoc>('migrations');
    migrationsDoc.version = 7;
    await db.put(migrationsDoc);
  }
}

export default V7AddRecurrenceIndex;
