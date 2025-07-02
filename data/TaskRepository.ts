import PouchDB from 'pouchdb';
import { DocumentTypes } from '@/data/documentTypes';
import { generateKeyBetween } from '@/helpers/fractionalIndexing';
import { Logger } from '@/helpers/Logger';
import { NewTask, sortedTasks, Task, TaskStatus } from './documentTypes/Task';

export type getTasksParams = {
  context?: string;
  statuses?: TaskStatus[];
};

export class TaskRepository {
  protected db: PouchDB.Database<DocumentTypes>;

  constructor(database: PouchDB.Database<DocumentTypes>) {
    this.db = database;
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
      _id: `task-${new Date().toISOString()}-${Math.random().toString(36).substring(2, 15)}`,
      type: 'task',
      context: newTask.context,
      title: newTask.title,
      sortOrder,
      description: newTask.description,
      tags: tags.map((tag) => this.cleanTag(tag)),
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

  cleanTag(tag: string): string {
    // Remove leading/trailing whitespace and convert to lowercase
    const newTag = tag.trim();

    // Strip and preceding #
    return newTag.startsWith('#') ? newTag.slice(1) : newTag;
  }
}
