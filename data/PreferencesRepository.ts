import { DocumentTypes } from '@/data/documentTypes';
import { createDefaultPreferences, Preferences } from '@/data/documentTypes/Preferences';
import { Repository } from '@/data/Repository';
import { Logger } from '@/helpers/Logger';

export class PreferencesRepository implements Repository {
  protected db: PouchDB.Database<DocumentTypes>;

  constructor(database: PouchDB.Database<DocumentTypes>) {
    this.db = database;
  }

  async cleanup(): Promise<void> {}

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
}
