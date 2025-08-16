import { MigrationsDoc } from '@/data/documentTypes/MigrationsDoc';
import { Migration } from '../Migration';

/**
 * This class is defunct now. I later removed sorting completely in favor of
 * an algorithm. This class relied on a no-longer-present library, so I've
 * removed the migration code completely.
 */
class V4UpdateSortsToFractionalString implements Migration {
  getVersion(): number {
    return 4;
  }

  async needsMigration(db: PouchDB.Database): Promise<boolean> {
    const migrations = await db.get<MigrationsDoc>('migrations');
    return !(migrations && migrations.version >= this.getVersion());
  }

  async up(db: PouchDB.Database): Promise<void> {
    // Update the migrations document to reflect the new version
    const migrationsDoc = await db.get<MigrationsDoc>('migrations');
    migrationsDoc.version = 4;
    await db.put(migrationsDoc);
  }
}

export default V4UpdateSortsToFractionalString;
