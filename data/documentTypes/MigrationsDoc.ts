export interface MigrationsDoc {
  _id: string; // Should be 'migrations'
  version: number; // Current version of the migrations document
  migrations: string[];
}
