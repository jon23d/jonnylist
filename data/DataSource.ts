import PouchDB from 'pouchdb';
import { ContextRepository } from '@/data/ContextRepository';
import { DocumentTypes } from '@/data/documentTypes';
import { LocalSettings } from '@/data/documentTypes/LocalSettings';
import { createDefaultPreferences, Preferences } from '@/data/documentTypes/Preferences';
import { TaskRepository } from '@/data/TaskRepository';
import { Logger } from '@/helpers/Logger';
import { MigrationManager } from './migrations/MigrationManager';

/**
 * @TODO This whole thing needs error handling
 * @TODO Absolutely use pouchdb indices once the dust settles\
 */
export class DataSource {
  protected db: PouchDB.Database<DocumentTypes>;

  private migrationManager: MigrationManager;
  private syncHandler: PouchDB.Replication.Sync<{}> | null = null;
  private taskRepository: TaskRepository | null = null;
  private contextRepository: ContextRepository | null = null;

  public onMigrationStatusChange?: (isMigrating: boolean) => void;

  /**
   * Creates a new LocalDataSource instance.
   * If a database is provided, it will use that database; otherwise, it will create a new
   * PouchDB instance.
   *
   * @param database Optional PouchDB database instance to use.
   * @param migrationManager Optional MigrationManager instance to use for migrations.
   */
  constructor(database: PouchDB.Database<DocumentTypes>, migrationManager?: MigrationManager) {
    this.db = database;

    if (migrationManager) {
      this.migrationManager = migrationManager;
    } else {
      this.migrationManager = new MigrationManager(this.db);
    }
  }

  /**
   * Get the PouchDB database instance.
   */
  getDatabase(): PouchDB.Database<DocumentTypes> {
    return this.db;
  }

  /**
   * Cleanup all active subscriptions and resources.
   * This should be called when the DataSource instance is no longer needed
   * to prevent memory leaks and ensure proper cleanup of PouchDB change feeds.
   */
  async cleanup(): Promise<void> {
    Logger.info('Cleaning up DataSource');

    await this.getTaskRepository().cleanup();
    await this.getContextRepository().cleanup();

    Logger.info('DataSource cleanup completed');
  }

  /**
   * Create/return the TaskRepository singleton
   */
  getTaskRepository(): TaskRepository {
    if (!this.taskRepository) {
      this.taskRepository = new TaskRepository(this.db);
    }

    return this.taskRepository;
  }

  /**
   * Create/return the ContextRepository singleton
   */
  getContextRepository(): ContextRepository {
    if (!this.contextRepository) {
      this.contextRepository = new ContextRepository(this.db);
    }

    return this.contextRepository;
  }

  /**
   * Initialize the sync process with the remote server.
   *
   * TODO: This doesn't have nearly enough error handling.
   */
  async initializeSync() {
    Logger.info('Initializing sync');
    const settings = await this.getLocalSettings();

    if (!settings.syncServerUrl || !settings.syncServerAccessToken) {
      Logger.info('No sync server settings found, skipping sync setup');
      return;
    }

    const syncDb = this.createSyncDb(settings);
    await this.verifySyncConnection(syncDb);

    try {
      this.syncHandler = this.db
        .sync(syncDb, {
          live: true,
          retry: true,
        })
        .on('change', (info) => {
          Logger.info('Sync change:', info);
        })
        .on('paused', () => {
          Logger.info('Sync paused (up to date)');
        })
        .on('active', () => {
          Logger.info('Sync resumed');
        })
        .on('denied', (err) => {
          Logger.error('Sync denied:', err);
        })
        .on('complete', (info) => {
          Logger.info('Sync complete:', info);
        })
        .on('error', (err) => {
          Logger.error('Error replicating to remote database:', err);
          this.cancelSync();
        });
    } catch (error) {
      Logger.error('Error initializing sync:', error);
      this.cancelSync();
      throw error; // Re-throw to handle it in the calling code
    }
  }

  /**
   * Create a new PouchDB database for syncing with a couchdb server.
   *
   * @param settings
   */
  createSyncDb(settings: LocalSettings): PouchDB.Database {
    Logger.info('Creating sync database');
    return new PouchDB(settings.syncServerUrl, {
      headers: {
        Authorization: `Bearer ${settings.syncServerAccessToken}`,
      },
    } as PouchDB.Configuration.DatabaseConfiguration & { headers?: Record<string, string> });
  }

  /**
   * Cancels the current sync operation if it is active.
   */
  cancelSync() {
    Logger.info('Cancelling sync');
    if (this.syncHandler) {
      this.syncHandler.cancel();
      this.syncHandler = null;
    } else {
      Logger.info('No active sync to cancel');
    }
  }

  /**
   * Run any pending migrations.
   */
  async runMigrations(): Promise<void> {
    if (!(await this.migrationManager.needsMigration())) {
      return;
    }

    try {
      this.onMigrationStatusChange?.(true);
      await this.migrationManager.runMigrations();
    } finally {
      this.onMigrationStatusChange?.(false);
    }
  }

  /**
   * Fetch the current preferences from the database.
   * This will return a Preferences object with default values if no preferences are found.
   */
  async getPreferences(): Promise<Preferences> {
    try {
      return await this.db.get<Preferences>('preferences');
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        error.status === 404
      ) {
        return createDefaultPreferences();
      }
      Logger.error('Error fetching preferences:', error);
      throw error;
    }
  }

  /**
   * Set the preferences in the database.
   * This will update or create the preferences document with the provided values.
   *
   * @param preferences
   */
  async setPreferences(preferences: Preferences): Promise<void> {
    try {
      Logger.info('Setting preferences');
      await this.db.put<Preferences>(preferences);
    } catch (error) {
      Logger.error('Error setting preferences:', error);
      throw error; // Re-throw to handle it in the calling code
    }
  }

  /**
   * Get the local settings from the database. These settings are not synced to the server
   *
   */
  async getLocalSettings(): Promise<LocalSettings> {
    try {
      Logger.info('Getting local settings');
      return await this.db.get<LocalSettings>('_local/settings');
    } catch (error) {
      if (this.isPouchNotFoundError(error)) {
        // If the document does not exist, return default settings
        Logger.info('Local settings not found, returning default settings');
        return {
          _id: '_local/settings',
        };
      }
      Logger.error('Error getting local settings:', error);
      throw error;
    }
  }

  /**
   * Set the local settings in the database. These will never be synced to the server.
   *
   * @param settings
   */
  async setLocalSettings(settings: LocalSettings): Promise<void> {
    try {
      Logger.info('Setting local settings');
      await this.db.put<LocalSettings>(settings);
    } catch (error) {
      Logger.error('Error setting local settings:', error);
      throw error; // Re-throw to handle it in the calling code
    }
  }

  /**
   * Export all data from the database, excluding _local documents.
   */
  async exportAllData(): Promise<DocumentTypes[]> {
    Logger.info('Exporting all data from the database');
    try {
      const result = await this.db.allDocs<DocumentTypes>({
        include_docs: true,
      });

      return result.rows.map((row) => row.doc!);
    } catch (error) {
      Logger.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Import data into the database.
   * @param docs
   */
  async importData(docs: DocumentTypes[]): Promise<void> {
    Logger.info('Importing data into the database');
    try {
      // We probably don't want to allow _local documents to be imported, as it
      // can activate sync
      const filteredDocs = docs.filter((doc) => !doc._id.startsWith('_local/'));

      const cleanedDocs = filteredDocs.map((doc) => {
        const { _rev, ...cleanDoc } = doc as any;
        return cleanDoc;
      });

      await this.db.bulkDocs(cleanedDocs);
      Logger.info('Data imported successfully:');
    } catch (error) {
      Logger.error('Error importing data:', error);
      throw error; // Re-throw to handle it in the calling code
    }
  }

  private async verifySyncConnection(syncDb: PouchDB.Database): Promise<void> {
    try {
      await syncDb.info();
    } catch (error) {
      Logger.error('Error connecting to sync database:', error);
      throw new Error(
        'Failed to connect to sync database. Please check your sync server URL and access token.'
      );
    }
  }

  // Is the error a PouchDB not found error?
  private isPouchNotFoundError(err: any): err is PouchDB.Core.Error {
    return err && (err.status === 404 || err.name === 'not_found');
  }
}
