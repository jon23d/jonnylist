import { DocumentTypes } from '@/data/documentTypes';
import { createDefaultPreferences, Preferences } from '@/data/documentTypes/Preferences';
import { Repository } from '@/data/Repository';
import { Logger } from '@/helpers/Logger';

export type UnsubscribeFunction = () => void;
export type Subscriber = (preferences: Preferences) => void;

export class PreferencesRepository implements Repository {
  protected db: PouchDB.Database<DocumentTypes>;

  private changesFeed?: PouchDB.Core.Changes<Preferences>;
  private subscribers = new Set<Subscriber>();

  constructor(database: PouchDB.Database<DocumentTypes>) {
    this.db = database;
  }

  async cleanup(): Promise<void> {
    if (this.changesFeed) {
      this.changesFeed.cancel();
      this.changesFeed = undefined;
    }

    this.subscribers.clear();
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
   * Subscribe to changes in the preferences. This will initially fetch the preferences and invoke
   * the callback with the document, then set up a live changes feed to watch for updates, invoking
   * the callback with the updated preferences document whenever a change occurs.
   *
   * The return function should be used to unsubscribe from the changes feed when no longer needed
   * or when the component using this is unmounted.
   *
   * @param callback
   *
   * @return A function to unsubscribe from the changes feed.
   */
  subscribe(callback: Subscriber): UnsubscribeFunction {
    // Register the callback so that we can notify it of changes
    this.subscribers.add(callback);

    // Set up the PouchDB changes feed if this is the first subscriber
    if (this.subscribers.size === 1) {
      this.initializeChangesFeed();
    }

    // Provide the initial preferences to the callback
    try {
      this.getPreferences().then((preferences) => callback(preferences));
    } catch (error) {
      Logger.error('Error fetching initial preferences for watcher:', error);
      throw error;
    }

    // Return an unsubscribe function
    return () => this.removeSubscriber(callback);
  }

  /**
   * Initialize the PouchDB changes feed to listen for changes to the preferences document
   * This will set up a live feed that listens for any changes to a document with an
   * id of 'preferences' and notifies subscribers of the updated preferences.
   * @private
   */
  private initializeChangesFeed(): void {
    Logger.info('Initializing PouchDB changes feed for preferences');
    this.changesFeed = this.db
      .changes<Preferences>({
        live: true,
        since: 'now',
      })
      .on('change', async (change) => {
        // Check if the changed document's ID starts with our preferences prefix
        if (change.id === 'preferences') {
          try {
            const updatePreferences = await this.getPreferences();
            this.notifySubscribers(updatePreferences);
          } catch (error) {
            // TODO
            Logger.error('Error fetching updated preferences after change:', error);
          }
        }
      })
      .on('error', (err) => {
        // TODO
        Logger.error('Error in PouchDB changes feed for preferences:', err);
      });
  }

  /**
   * Notify all subscribers of preferences changes.
   */
  private notifySubscribers(preferences: Preferences): void {
    Logger.info('Notifying preferences change subscribers');
    this.subscribers.forEach((callback) => {
      try {
        callback(preferences);
      } catch (error) {
        // TODO
        Logger.error('Error notifying preferences change subscriber:', error);
      }
    });
  }

  /**
   * Remove a preferences subscriber and cancel the changes feed if there are no more subscribers.
   *
   * @param callback
   * @private
   */
  private removeSubscriber(callback: Subscriber): void {
    Logger.info('Removing preferences change subscriber');
    this.subscribers.delete(callback);

    if (this.subscribers.size === 0 && this.changesFeed) {
      Logger.info('No more preferences subscribers, cancelling changes feed');
      this.changesFeed.cancel();
      this.changesFeed = undefined;
    }
  }
}
