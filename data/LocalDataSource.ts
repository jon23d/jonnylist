import PouchDB from 'pouchdb';
import {
  ContextSubscriber,
  DataSource,
  getTasksParams,
  UnsubscribeFunction,
} from '@/data/DataSource';
import { DocumentTypes } from '@/data/interfaces';
import { Context } from '@/data/interfaces/Context';
import { Task } from '@/data/interfaces/Task';
import { Logger } from '@/helpers/logger';
import { TaskFactory } from '@/test-utils/factories/TaskFactory';

const DATABASE_NAME = 'jonnylist';
const CURRENT_VERSION = 1;

export class LocalDataSource implements DataSource {
  protected db: PouchDB.Database<DocumentTypes>;
  private contextChangesFeed?: PouchDB.Core.Changes<DocumentTypes>;
  private contextChangeSubscribers = new Set<ContextSubscriber>();

  /**
   * Creates a new LocalDataSource instance.
   * If a database is provided, it will use that database; otherwise, it will create a new
   * PouchDB instance.
   *
   * @param database Optional PouchDB database instance to use.
   */
  constructor(database?: PouchDB.Database<DocumentTypes>) {
    if (database) {
      this.db = database;
      return;
    }
    this.db = new PouchDB(DATABASE_NAME);
  }

  /**
   * Do a one-time fetch of tasks based on the provided parameters.
   *
   * @param _params
   */
  async getTasks(_params: getTasksParams): Promise<Task[]> {
    const taskFactory = new TaskFactory();
    return [
      taskFactory.create(),
      taskFactory.create({
        _id: '2',
      }),
    ];
  }

  /**
   * Fetch all context names from the database.
   */
  async getContexts(): Promise<string[]> {
    const result = await this.db.allDocs<Context>({
      include_docs: true,
      startkey: 'context-',
      // A high value Unicode character ensures we get all contexts
      endkey: 'context-\ufff0',
    });

    return result.rows.map((row) => row.doc!.name);
  }

  /**
   * Add a new context to the database.
   * This will create a new document with the type 'context' and the provided name.
   *
   * @param context
   */
  async addContext(context: string): Promise<void> {
    const doc: Context = {
      _id: `context-${context}`,
      type: 'context',
      name: context,
      version: CURRENT_VERSION,
    };
    await this.db.put(doc);
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
      .changes({
        live: true,
        since: 'now',
      })
      .on('change', async (change) => {
        // Check if the changed document's ID starts with our context prefix
        if (change.id.startsWith('context-')) {
          try {
            const updatedContexts = await this.getContexts();
            Logger.info('Updated contexts after change:', updatedContexts);
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
  private notifyContextSubscribers(contexts: string[]): void {
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
