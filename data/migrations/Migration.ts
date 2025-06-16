import PouchDB from 'pouchdb';

export interface Migration {
  /**
   * Returns true if this migration needs to be applied
   */
  needsMigration(db: PouchDB.Database): Promise<boolean>;

  /**
   * Applies the migration
   */
  up(db: PouchDB.Database): Promise<void>;

  /**
   * Returns the version number of this migration
   */
  getVersion(): number;
}
