import PouchDB from 'pouchdb';
import {
  ContextSubscriber,
  DATABASE_VERSION,
  DataSource,
  getTasksParams,
  TaskSubscriber,
  UnsubscribeFunction,
} from '@/data/DataSource';
import { DocumentTypes } from '@/data/documentTypes';
import { Context } from '@/data/documentTypes/Context';
import { createDefaultPreferences, Preferences } from '@/data/documentTypes/Preferences';
import { NewTask, Task } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/logger';

const DATABASE_NAME = 'jonnylist';

type TaskSubscriberWithFilterParams = {
  params: getTasksParams;
  callback: TaskSubscriber;
};

/**
 * @TODO This whole thing needs error handling
 * @TODO Absolutely use pouchdb indices once the dust settles
 * @TODO It feels like the pouch stuff may belong in a separate class
 */
export class LocalDataSource implements DataSource {
  protected db: PouchDB.Database<DocumentTypes>;
  private taskChangesFeed?: PouchDB.Core.Changes<Task>;
  private taskChangeSubscribers = new Set<TaskSubscriberWithFilterParams>();
  private contextChangesFeed?: PouchDB.Core.Changes<Context>;
  private contextChangeSubscribers = new Set<ContextSubscriber>();
  public onMigrationStatusChange?: (isMigrating: boolean) => void;

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
   * Fetch the current preferences from the database.
   * This will return a Preferences object with default values if no preferences are found.
   */
  async getPreferences(): Promise<Preferences> {
    try {
      return await this.db.get<Preferences>('preferences');
    } catch (error) {
      // This is a 404, @TODO: handle other errors
      return createDefaultPreferences();
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
   * Add a new task to the database.
   * This will create a new document with the type 'task' and the provided values.
   *
   * @param newTask
   */
  async addTask(newTask: NewTask): Promise<Task> {
    Logger.info('Adding task');
    const task: Task = {
      _id: `task-${new Date().toISOString()}-${Math.random().toString(36).substring(2, 15)}`,
      type: 'task',
      context: newTask.context,
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: DATABASE_VERSION,
    };

    try {
      await this.db.put(task);
      return task;
    } catch (error) {
      Logger.error('Error adding task:', error);
      throw error; // Re-throw to handle it in the calling code
    }
  }

  async updateTask(task: Task): Promise<Task> {
    Logger.info('Updating task');

    // Update the updatedAt timestamp
    task.updatedAt = new Date();

    let response;

    try {
      response = await this.db.put(task);
    } catch (error) {
      Logger.error('Error updating task:', error);
      throw error; // Re-throw to handle it in the calling code
    }

    if (response.ok) {
      return task;
    }

    throw new Error('Failed to update task');
  }

  /**
   * Do a one-time fetch of tasks based on the provided parameters.
   *
   * @param params
   */
  async getTasks(params: getTasksParams): Promise<Task[]> {
    Logger.info('Getting tasks');
    const result = await this.db.allDocs<Task>({
      include_docs: true,
      startkey: 'task-',
      endkey: 'task-\ufff0',
    });

    const allTasks = result.rows.map((row) => row.doc as Task);

    // Convert dates to Date objects
    allTasks.forEach((task) => {
      if (task.dueDate) {
        task.dueDate = new Date(task.dueDate);
      }
      task.createdAt = new Date(task.createdAt);
      task.updatedAt = new Date(task.updatedAt);
    });

    return this.filterTasksByParams(allTasks, params);
  }

  /**
   * Subscribe to changes in tasks based on the provided parameters.
   * This will set up a live changes feed that listens for updates to tasks matching the
   * provided parameters and invokes the callback with the updated tasks whenever a change occurs.
   *
   * The return function should be used to unsubscribe from the changes feed when no longer needed
   * or when the component using this is unmounted.
   *
   * @param params
   * @param callback
   *
   * @return A function to unsubscribe from the changes feed.
   */
  subscribeToTasks(params: getTasksParams, callback: (tasks: Task[]) => void): UnsubscribeFunction {
    // Register the callback so that we can notify it of changes
    this.taskChangeSubscribers.add({ callback, params });

    // Set up the PouchDB changes feed if this is the first subscriber
    if (this.taskChangeSubscribers.size === 1) {
      this.initializeTaskChangesFeed();
    }

    // Provide the initial tasks to the callback
    this.getTasks(params)
      .then((tasks) => callback(tasks))
      .catch((error) => {
        Logger.error('Error fetching initial tasks for watcher:', error);
      });

    // Return an unsubscribe function
    return () => this.removeTaskSubscriber({ callback, params });
  }

  /**
   * Fetch all context names from the database.
   */
  async getContexts(): Promise<string[]> {
    const result = await this.db.allDocs<Context>({
      include_docs: true,
      startkey: 'context-',
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
      version: DATABASE_VERSION,
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

  filterTasksByParams(tasks: Task[], params: getTasksParams): Task[] {
    return tasks.filter((task) => {
      if (params.context && task.context !== params.context) {
        return false;
      }
      return !(params.statuses && !params.statuses.includes(task.status));
    });
  }

  private initializeTaskChangesFeed(): void {
    Logger.info('Initializing PouchDB changes feed for tasks');
    this.taskChangesFeed = this.db
      .changes<Task>({
        live: true,
        since: 'now',
      })
      .on('change', async (change) => {
        if (change.id.startsWith('task-')) {
          try {
            // This is probably pretty inefficient. We should only fetch
            // The tasks that have actually changed
            // TODO: Deal with this before it gets out of hand
            const updatedTasks = await this.getTasks({});
            this.notifyTaskSubscribers(updatedTasks);
          } catch (error) {
            // TODO
            Logger.error('Error fetching updated tasks after change:', error);
          }
        }
      })
      .on('error', (err) => {
        // TODO
        Logger.error('Error in PouchDB changes feed for tasks:', err);
      });
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

  private notifyTaskSubscribers(tasks: Task[]): void {
    Logger.info('Notifying task change subscribers');
    this.taskChangeSubscribers.forEach((taskSubscriber: TaskSubscriberWithFilterParams) => {
      try {
        const tasksToNotify = this.filterTasksByParams(tasks, taskSubscriber.params);
        taskSubscriber.callback(tasksToNotify);
      } catch (error) {
        // TODO
        Logger.error('Error notifying task change subscriber:', error);
      }
    });
  }

  /**
   * Notify all subscribers of context changes.
   *
   * @param contexts
   * @private
   */
  private notifyContextSubscribers(contexts: string[]): void {
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

  private removeTaskSubscriber(subscriber: TaskSubscriberWithFilterParams): void {
    Logger.info('Removing task change subscriber');
    this.taskChangeSubscribers.delete(subscriber);

    if (this.taskChangeSubscribers.size === 0 && this.taskChangesFeed) {
      Logger.info('No more task subscribers, cancelling changes feed');
      this.taskChangesFeed.cancel();
      this.taskChangesFeed = undefined;
    }
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
