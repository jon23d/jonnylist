import PouchDB from 'pouchdb';
import { DataSource, getTasksParams, Task } from '@/data/DataSource';
import { DocumentTypes } from '@/data/interfaces';
import { Context } from '@/data/interfaces/Context';

const DATABASE_NAME = 'jonnylist';
const CURRENT_VERSION = 1;

export class LocalDataSource implements DataSource {
  protected db: PouchDB.Database<DocumentTypes>;
  private contextChangesFeed?: PouchDB.Core.Changes<DocumentTypes>;

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

  async watchContexts(callback: (contexts: string[]) => void): Promise<void> {
    try {
      const initialContexts = await this.getContexts();
      callback(initialContexts);
    } catch (error) {
      // TODO
      console.error('Error fetching initial contexts for watcher:', error);
    }

    // 2. Set up the PouchDB changes feed
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
            callback(updatedContexts);
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

    return Promise.resolve();
  }

  async unwatchContexts(): Promise<void> {
    if (this.contextChangesFeed) {
      this.contextChangesFeed.cancel();
      this.contextChangesFeed = undefined;
    }
    return Promise.resolve();
  }
}
