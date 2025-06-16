import { Migration } from './Migration';
import V1AddMigrationsDoc from './V1AddMigrationsDoc';

export class MigrationManager {
  private migrations: Migration[] = [
    new V1AddMigrationsDoc(),
    // Add new migrations here
  ];

  constructor(private db: PouchDB.Database) {}

  async needsMigration(): Promise<boolean> {
    for (const migration of this.migrations) {
      if (await migration.needsMigration(this.db)) {
        return true;
      }
    }
    return false;
  }

  async runMigrations(): Promise<void> {
    for (const migration of this.migrations) {
      if (await migration.needsMigration(this.db)) {
        await migration.up(this.db);
      }
    }
  }
}
