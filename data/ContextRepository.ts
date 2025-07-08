import { DocumentTypes } from '@/data/documentTypes';
import { Context, NewContext } from '@/data/documentTypes/Context';
import { Repository } from '@/data/Repository';
import { Logger } from '@/helpers/Logger';

export type UnsubscribeFunction = () => void;
export type ContextSubscriber = (contexts: Context[]) => void;

export class ContextRepository implements Repository {
  protected db: PouchDB.Database<DocumentTypes>;

  private contextChangesFeed?: PouchDB.Core.Changes<Context>;
  private contextChangeSubscribers = new Set<ContextSubscriber>();

  constructor(database: PouchDB.Database<DocumentTypes>) {
    this.db = database;
  }

  async cleanup(): Promise<void> {
    if (this.contextChangesFeed) {
      this.contextChangesFeed.cancel();
      this.contextChangesFeed = undefined;
    }

    // Clear all subscribers
    this.contextChangeSubscribers.clear();
  }

  /**
   * Fetch all context names from the database.
   */
  async getContexts(): Promise<Context[]> {
    const result = await this.db.allDocs<Context>({
      include_docs: true,
      startkey: 'context-',
      endkey: 'context-\ufff0',
    });

    return result.rows.map((row) => row.doc!);
  }

  /**
   * Fetch a specific context by its ID.
   *
   * @param id
   */
  async getContext(id: string): Promise<Context> {
    try {
      const doc = await this.db.get<Context>(id);

      if (doc.type !== 'context') {
        throw new Error(`Document with ID ${id} is not a context.`);
      }

      return doc;
    } catch (error) {
      Logger.error(`Error fetching context with ID ${id}:`, error);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  /**
   * Add a new context to the database.
   * This will create a new document with the type 'context' and the provided name.
   *
   * @param context
   */
  async addContext(context: NewContext): Promise<Context> {
    const doc: Context = {
      _id: `context-${Math.random().toString(36).substring(2, 15)}`,
      type: 'context',
      ...context,
    };
    const result = await this.db.put(doc);
    return { ...doc, _rev: result.rev };
  }

  /**
   * Update an existing context in the database.
   *
   * @param context
   */
  async updateContext(context: Context): Promise<void> {
    try {
      await this.db.put(context);
    } catch (error) {
      Logger.error(`Error updating context with ID ${context._id}:`, error);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  /**
   * Delete a context from the database.
   * @param context
   */
  async deleteContext(context: Context): Promise<void> {
    try {
      await this.db.put({
        ...context,
        _deleted: true,
      });
    } catch (error) {
      Logger.error(`Error deleting context with ID ${context._id}:`, error);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  /**
   * Subscribe to changes in contexts. This will initially fetch all contexts and invoke the
   * callback with them, then set up a live changes feed to watch for updates, invoking the
   * callback with the updated contexts whenever a change occurs.
   *
   * The return function should be used to unsubscribe from the changes feed when no longer needed
   * or when the component using this is unmounted.
   *
   * @param callback
   *
   * @return A function to unsubscribe from the changes feed.
   */
  subscribeToContexts(callback: ContextSubscriber): UnsubscribeFunction {
    // Register the callback so that we can notify it of changes
    this.contextChangeSubscribers.add(callback);

    // Set up the PouchDB changes feed if this is the first subscriber
    if (this.contextChangeSubscribers.size === 1) {
      this.initializeContextChangesFeed();
    }

    // Provide the initial contexts to the callback
    try {
      this.getContexts().then((contexts) => callback(contexts));
    } catch (error) {
      // TODO
      Logger.error('Error fetching initial contexts for watcher:', error);
    }

    // Return an unsubscribe function
    return () => this.removeContextSubscriber(callback);
  }

  /**
   * Initialize the PouchDB changes feed to listen for changes to context documents.
   * This will set up a live feed that listens for any changes to documents with IDs starting
   * with 'context-' and notifies subscribers of the updated contexts.
   * @private
   */
  private initializeContextChangesFeed(): void {
    Logger.info('Initializing PouchDB changes feed for contexts');
    this.contextChangesFeed = this.db
      .changes<Context>({
        live: true,
        since: 'now',
      })
      .on('change', async (change) => {
        // Check if the changed document's ID starts with our context prefix
        if (change.id.startsWith('context-')) {
          try {
            const updatedContexts = await this.getContexts();
            this.notifyContextSubscribers(updatedContexts);
          } catch (error) {
            // TODO
            Logger.error('Error fetching updated contexts after change:', error);
          }
        }
      })
      .on('error', (err) => {
        // TODO
        Logger.error('Error in PouchDB changes feed for contexts:', err);
      });
  }

  /**
   * Notify all subscribers of context changes.
   *
   * @param contexts
   * @private
   */
  private notifyContextSubscribers(contexts: Context[]): void {
    Logger.info('Notifying context change subscribers');
    this.contextChangeSubscribers.forEach((callback) => {
      try {
        callback(contexts);
      } catch (error) {
        // TODO
        Logger.error('Error notifying context change subscriber:', error);
      }
    });
  }

  /**
   * Remove a context subscriber and cancel the changes feed if there are no more subscribers.
   *
   * @param callback
   * @private
   */
  private removeContextSubscriber(callback: ContextSubscriber): void {
    Logger.info('Removing context change subscriber');
    this.contextChangeSubscribers.delete(callback);

    if (this.contextChangeSubscribers.size === 0 && this.contextChangesFeed) {
      Logger.info('No more context subscribers, cancelling changes feed');
      this.contextChangesFeed.cancel();
      this.contextChangesFeed = undefined;
    }
  }
}
