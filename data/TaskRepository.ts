import PouchDB from 'pouchdb';
import { DocumentTypes } from '@/data/documentTypes';
import { Repository } from '@/data/Repository';
import { generateKeyBetween } from '@/helpers/fractionalIndexing';
import { Logger } from '@/helpers/Logger';
import { NewTask, sortedTasks, Task, TaskStatus } from './documentTypes/Task';

export type getTasksParams = {
  context?: string;
  statuses?: TaskStatus[];
};

type TaskSubscriberWithFilterParams = {
  params: getTasksParams;
  callback: TaskSubscriber;
};

export type UnsubscribeFunction = () => void;
export type TaskSubscriber = (tasks: Task[]) => void;

export class TaskRepository implements Repository {
  protected db: PouchDB.Database<DocumentTypes>;
  private taskChangeSubscribers = new Set<TaskSubscriberWithFilterParams>();
  private taskChangesFeed?: PouchDB.Core.Changes<Task>;

  constructor(database: PouchDB.Database<DocumentTypes>) {
    this.db = database;
  }

  async cleanup(): Promise<void> {
    if (this.taskChangesFeed) {
      this.taskChangesFeed.cancel();
      this.taskChangesFeed = undefined;
    }

    this.taskChangeSubscribers.clear();
  }

  /**
   * Add a new task to the database.
   * This will create a new document with the type 'task' and the provided values.
   *
   * @param newTask
   */
  async addTask(newTask: NewTask): Promise<Task> {
    Logger.info('Adding task');

    // Get the last task of this context and status to determine the sort order
    const tasks = await this.getTasks({
      context: newTask.context,
      statuses: [newTask.status],
    });

    const lastSortOrder = tasks.length ? tasks[tasks.length - 1].sortOrder : null;
    const sortOrder = generateKeyBetween(lastSortOrder, null);

    const tags = newTask.tags || [];

    const task: Task = {
      ...newTask,
      _id: `task-${new Date().toISOString()}-${Math.random().toString(36).substring(2, 15)}`,
      type: 'task',
      sortOrder,
      tags: tags.map((tag) => this.cleanTag(tag)),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const response = await this.db.put(task);
      return { ...task, _rev: response.rev }; // Return the task with the revision ID
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

    const updatedTask = {
      ...task,
      updatedAt: new Date(),
      tags: task.tags?.map((tag) => this.cleanTag(tag)),
    };

    let response;

    try {
      response = await this.db.put(updatedTask);
      Logger.info('Updated task');
    } catch (error) {
      Logger.error('Error updating task:', error);
      throw error; // Re-throw to handle it in the calling code
    }

    if (response.ok) {
      return updatedTask;
    }

    throw new Error('Failed to update task');
  }

  /**
   * Bulk update multiple tasks
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

    const filtered = this.filterTasksByParams(allTasks, params);

    return sortedTasks(filtered);
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
   * Clean a tag by removing leading/trailing whitespace or leading # character.
   *
   * @param tag
   */
  cleanTag(tag: string): string {
    // Remove leading/trailing whitespace and convert to lowercase
    const newTag = tag.trim();

    // Strip and preceding #
    return newTag.startsWith('#') ? newTag.slice(1) : newTag;
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
}
