import { underline } from 'next/dist/lib/picocolors';
import { DocumentTypes } from '@/data/documentTypes';
import { Repository } from '@/data/Repository';
import { Logger } from '@/helpers/Logger';
import { NewTask, Task, TaskStatus } from './documentTypes/Task';

export type getTasksParams = {
  statuses?: TaskStatus[];
  due?: true;
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

    const tags = newTask.tags || [];

    const task: Task = {
      ...newTask,
      _id: `task-${new Date().toISOString()}-${Math.random().toString(36).substring(2, 15)}`,
      type: 'task',
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
      return { ...updatedTask, _rev: response.rev };
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

  async addNote(taskId: string, noteText: string): Promise<Task> {
    Logger.info('Adding note to task', taskId);

    try {
      const task = await this.db.get<Task>(taskId);
      const newNote = {
        noteText,
        createdAt: new Date().toISOString(),
      };

      // Ensure notes is initialized
      if (!task.notes) {
        task.notes = [];
      }

      task.notes.push(newNote);
      return await this.updateTask(task);
    } catch (error) {
      Logger.error('Error adding note to task:', error);
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

    return this.filterTasksByParams(allTasks, params);
  }

  /**
   * Filter tasks based on the provided getTaskParams object.
   *
   * @param tasks
   * @param params
   */
  filterTasksByParams(tasks: Task[], params: getTasksParams): Task[] {
    return tasks.filter((task) => {
      const matchesStatus = !params.statuses || params.statuses.includes(task.status);
      const matchesDue = !params.due || (task.dueDate && new Date() >= new Date(task.dueDate));

      return matchesStatus && matchesDue;
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
   * This function will look for tasks that have a waitUntil date that is today or in the past,
   * and then update their status to TaskStatus.Ready if they are not already.
   */
  checkWaitingTasks(): Promise<void> {
    Logger.info('Checking for waiting tasks to update to ready status');
    this.getTasks({ statuses: [TaskStatus.Waiting] })
      .then((waitingTasks) => {
        const now = new Date();
        const tasksToUpdate = waitingTasks.filter((task) => {
          return (
            task.waitUntil && new Date(task.waitUntil) <= now && task.status !== TaskStatus.Ready
          );
        });

        if (tasksToUpdate.length > 0) {
          Logger.info(`Updating ${tasksToUpdate.length} waiting tasks to ready status`);
          return this.updateTasks(
            tasksToUpdate.map((task) => ({ ...task, status: TaskStatus.Ready }))
          );
        }
      })
      .catch((error) => {
        Logger.error('Error checking waiting tasks:', error);
      });

    return Promise.resolve();
  }

  checkRecurringTasks(): Promise<void> {
    Logger.info('Checking for recurring tasks to create new instances');
    this.getTasks({ statuses: [TaskStatus.Recurring] })
      .then((recurringTasks) => {
        const now = new Date();
        const tasksToCreate: NewTask[] = [];

        recurringTasks.forEach((task) => {
          if (task.recurrence && task.recurrence.interval) {
            // We need to find the last occurrence of this task, then create a new one
            // if we have met the recurrence criteria. We can find the last occurrence
            // of this task by looking for a task that has a recurrenceTemplateId that
            // matches this task's _id
            this.db
              .find({
                selector: {
                  type: 'task',
                  recurrenceTemplateId: task._id,
                },
                sort: [{ updatedAt: 'desc' }],
                limit: 1,
              })
              .then((result) => {
                const lastOccurrence = result.docs[0] as Task | undefined;

                // We only create a new task if the status of the last one is
                // not started or ready
                if (
                  lastOccurrence?.status !== TaskStatus.Ready &&
                  lastOccurrence?.status !== TaskStatus.Started
                ) {
                  const newTask: Task = {
                    title: task.title,
                    description: task.description,
                    tags: task.tags,
                    project: task.project,
                    status: TaskStatus.Ready,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    notes: [],
                    recurrenceTemplateId: task._id, // Link to the original recurring task
                  };
                }
              });
          }
        });

        if (tasksToCreate.length > 0) {
          Logger.info(`Creating ${tasksToCreate.length} new recurring tasks`);
          return this.addTasks(tasksToCreate);
        }
      })
      .catch((error) => {
        Logger.error('Error checking recurring tasks:', error);
      });

    return Promise.resolve();
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
