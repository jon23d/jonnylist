import { VERSIONS } from './versions/Versions';

export class MigrationManager {
  constructor(private db: PouchDB.Database) {}

  async needsMigration(): Promise<boolean> {
    for (const migration of VERSIONS) {
      if (await migration.needsMigration(this.db)) {
        return true;
      }
    }
    return false;
  }

  async runMigrations(): Promise<void> {
    for (const migration of VERSIONS) {
      if (await migration.needsMigration(this.db)) {
        await migration.up(this.db);
      }
    }
  }
}
