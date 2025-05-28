import PouchDB from 'pouchdb';
import {
  ContextChangeCallback,
  DataSource,
  getTasksParams,
  Task,
  UnsubscribeFunction,
} from '@/data/DataSource';
import { DocumentTypes } from '@/data/interfaces';
import { Context } from '@/data/interfaces/Context';

const DATABASE_NAME = 'jonnylist';
const CURRENT_VERSION = 1;

export class LocalDataSource implements DataSource {
  protected db: PouchDB.Database<DocumentTypes>;
  private contextChangesFeed?: PouchDB.Core.Changes<DocumentTypes>;
  private contextChangeSubscribers = new Set<ContextChangeCallback>();

  constructor(database?: PouchDB.Database<DocumentTypes>) {
    if (database) {
      this.db = database;
      return;
    }
    this.db = new PouchDB(DATABASE_NAME);
  }

  async getTasks(_params: getTasksParams): Promise<Task[]> {
    return Promise.resolve([]);
  }

  async getContexts(): Promise<string[]> {
    const result = await this.db.allDocs<Context>({
      include_docs: true,
      startkey: 'context-',
      // A high value Unicode character ensures we get all contexts
      endkey: 'context-\ufff0',
    });

    return result.rows.map((row) => row.doc!.name);
  }

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
  watchContexts(callback: ContextChangeCallback): UnsubscribeFunction {
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
      console.error('Error fetching initial contexts for watcher:', error);
    }

    // Return an unsubscribe function
    return () => {
      console.log('Unsubscribing from context changes feed');
      this.contextChangeSubscribers.delete(callback);
      if (this.contextChangeSubscribers.size === 0 && this.contextChangesFeed) {
        this.contextChangesFeed.cancel();
        this.contextChangesFeed = undefined;
      }
    };
  }

  private initializeContextChangesFeed(): void {
    console.log('Initializing PouchDB changes feed for contexts');
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
            console.log('Updated contexts after change:', updatedContexts);
            this.notifyContextChangeSubscribers(updatedContexts);
          } catch (error) {
            // TODO
            console.error('Error fetching updated contexts after change:', error);
          }
        }
      })
      .on('error', (err) => {
        // TODO
        console.error('Error in PouchDB changes feed for contexts:', err);
      });
  }

  private notifyContextChangeSubscribers(contexts: string[]): void {
    this.contextChangeSubscribers.forEach((callback) => {
      try {
        callback(contexts);
      } catch (error) {
        // TODO
        console.error('Error notifying context change subscriber:', error);
      }
    });
  }

  async unwatchContexts(): Promise<void> {
    if (this.contextChangesFeed) {
      this.contextChangesFeed.cancel();
      this.contextChangesFeed = undefined;
    }
    return Promise.resolve();
  }
}
