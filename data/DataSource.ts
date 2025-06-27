import PouchDB from 'pouchdb';
import { DocumentTypes } from '@/data/documentTypes';
import { Context } from '@/data/documentTypes/Context';
import { LocalSettings } from '@/data/documentTypes/LocalSettings';
import { createDefaultPreferences, Preferences } from '@/data/documentTypes/Preferences';
import { NewTask, Task, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';
import { MigrationManager } from './migrations/MigrationManager';

export const DATABASE_VERSION = 3;

type TaskSubscriberWithFilterParams = {
  params: getTasksParams;
  callback: TaskSubscriber;
};

export type getTasksParams = {
  context?: string;
  statuses?: TaskStatus[];
};

export type UnsubscribeFunction = () => void;
export type TaskSubscriber = (tasks: Task[]) => void;
export type ContextSubscriber = (contexts: string[]) => void;

/**
 * @TODO This whole thing needs error handling
 * @TODO Absolutely use pouchdb indices once the dust settles
 * @TODO It feels like the pouch stuff may belong in a separate class
 */
export class DataSource {
  protected db: PouchDB.Database<DocumentTypes>;
  private taskChangesFeed?: PouchDB.Core.Changes<Task>;
  private taskChangeSubscribers = new Set<TaskSubscriberWithFilterParams>();
  private contextChangesFeed?: PouchDB.Core.Changes<Context>;
  private contextChangeSubscribers = new Set<ContextSubscriber>();
  private migrationManager: MigrationManager;
  private syncHandler: PouchDB.Replication.Sync<{}> | null = null;
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
   * Get the schema version of the database.
   */
  getVersion(): number {
    return DATABASE_VERSION;
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
      sortOrder: newTask.sortOrder,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const response = await this.db.put(task);
      return { _rev: response.rev, ...task }; // Return the task with the revision ID
    } catch (error) {
      Logger.error('Error adding task:', error);
      throw error; // Re-throw to handle it in the calling code
    }
  }

  /**
   * Update an existing task in the database.
   *
   * @param task
   */
  async updateTask(task: Task): Promise<Task> {
    Logger.info('Updating task');

    // Update the updatedAt timestamp
    task.updatedAt = new Date();

    let response;

    try {
      response = await this.db.put(task);
      Logger.info('Updated task');
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
   * Bulki update multiple tasks
   *
   * @param tasks
   */
  async updateTasks(tasks: Task[]): Promise<Task[]> {
    Logger.info('Updating multiple tasks');
    const updatedTasks: Task[] = tasks.map((task) => {
      return { ...task, updatedAt: new Date() };
    });

    const taskMap = new Map<string, Task>();
    updatedTasks.forEach((task) => {
      taskMap.set(task._id, task);
    });

    try {
      const response = await this.db.bulkDocs(updatedTasks);
      Logger.info('Updated tasks successfully');

      // Update the _rev field for each task in the map
      for (const result of response) {
        // TODO: We are making a lot of assumptions here. They are probably pretty safe, but
        // let's consider better error handling
        const taskInMap = taskMap.get(result.id!);
        taskInMap!._rev = result.rev;
      }

      return updatedTasks;
    } catch (error) {
      Logger.error('Error updating tasks:', error);
      throw error; // Re-throw to handle it in the calling code
    }
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
    // TODO: Think more about how we handle dates
    allTasks.forEach((task) => {
      if (task.dueDate) {
        const date = new Date(task.dueDate);
        task.dueDate = date.toISOString().split('T')[0];
      }
      task.createdAt = new Date(task.createdAt);
      task.updatedAt = new Date(task.updatedAt);
    });

    // Sort by Task.sortOrders asc
    allTasks.sort((a, b) => {
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    return this.filterTasksByParams(allTasks, params);
  }

  /**
   * Archive a context by moving all tasks from the source context to the destination context
   *
   * @param sourceContext
   * @param destinationContext
   */
  async archiveContext(sourceContext: string, destinationContext: string): Promise<void> {
    Logger.info(`Archiving context: ${sourceContext} to ${destinationContext}`);

    // We are going to move open tasks from the source context to the destination context
    await this.moveOpenTasksInContext(sourceContext, destinationContext);

    // Mark the source context as deleted
    const sourceContextDoc = await this.db.get<Context>(`context-${sourceContext}`);
    sourceContextDoc.deletedAt = new Date();
    await this.db.put(sourceContextDoc);

    Logger.info(`Archived context: ${sourceContext}`);
  }

  /**
   * Move all open tasks from the source context to the destination context.
   * This will update the context field of all tasks in the source context to the destination context.
   *
   * @param sourceContext
   * @param destinationContext
   */
  async moveOpenTasksInContext(sourceContext: string, destinationContext: string): Promise<void> {
    Logger.info(`Moving tasks from context: ${sourceContext} to ${destinationContext}`);

    // Fetch all tasks in the source context
    const tasks = await this.getTasks({
      context: sourceContext,
      statuses: [TaskStatus.Ready, TaskStatus.Waiting, TaskStatus.Started],
    });

    if (tasks.length !== 0) {
      const updatedTasks = tasks.map((task) => ({
        ...task,
        context: destinationContext,
      }));

      await this.updateTasks(updatedTasks);
    }

    Logger.info(`Moved tasks from context: ${sourceContext} to ${destinationContext}`);
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
  async getContexts(includeDeleted?: boolean): Promise<string[]> {
    const _includeDeleted = includeDeleted ?? false;

    const result = await this.db.allDocs<Context>({
      include_docs: true,
      startkey: 'context-',
      endkey: 'context-\ufff0',
    });

    // Filter out archived contexts if not requested
    if (!_includeDeleted) {
      result.rows = result.rows.filter((row) => !row.doc?.deletedAt);
    }

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
   * Filter tasks based on the provided getTaskParams object.
   *
   * @param tasks
   * @param params
   */
  filterTasksByParams(tasks: Task[], params: getTasksParams): Task[] {
    return tasks.filter((task) => {
      if (params.context && task.context !== params.context) {
        return false;
      }
      return !(params.statuses && !params.statuses.includes(task.status));
    });
  }

  /**
   * Cleanup all active subscriptions and resources.
   * This should be called when the LocalDataSource instance is no longer needed
   * to prevent memory leaks and ensure proper cleanup of PouchDB change feeds.
   */
  async cleanup(): Promise<void> {
    Logger.info('Cleaning up LocalDataSource');

    // Cancel active change feeds
    if (this.taskChangesFeed) {
      this.taskChangesFeed.cancel();
      this.taskChangesFeed = undefined;
    }

    if (this.contextChangesFeed) {
      this.contextChangesFeed.cancel();
      this.contextChangesFeed = undefined;
    }

    // Clear all subscribers
    this.taskChangeSubscribers.clear();
    this.contextChangeSubscribers.clear();

    Logger.info('LocalDataSource cleanup completed');
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

  /**
   * Initialize the PouchDB changes feed to listen for changes to task documents.
   *
   * @private
   */
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

  /**
   * Notify all subscribers of task changes.
   *
   * @param tasks
   * @private
   */
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

  /**
   * Remove a task subscriber and cancel the changes feed if there are no more subscribers.
   *
   * @param subscriber
   * @private
   */
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

  // Is the error a PouchDB not found error?
  private isPouchNotFoundError(err: any): err is PouchDB.Core.Error {
    return err && (err.status === 404 || err.name === 'not_found');
  }
}
