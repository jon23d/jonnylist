import { DocumentTypes } from '@/data/documentTypes';
import { PreferencesRepository } from '@/data/PreferencesRepository';
import { Repository } from '@/data/Repository';
import { Logger } from '@/helpers/Logger';
import { TaskFilterer } from '@/helpers/TaskFilterer';
import { UrgencyCalculator } from '@/helpers/UrgencyCalculator';
import { NewTask, Task, TaskFilter, TaskStatus } from './documentTypes/Task';

type TaskSubscriberWithFilter = {
  params: TaskFilter;
  callback: TaskSubscriber;
};

export type UnsubscribeFunction = () => void;
export type TaskSubscriber = (tasks: Task[]) => void;

export class TaskRepository implements Repository {
  protected db: PouchDB.Database<DocumentTypes>;
  private taskChangeSubscribers = new Set<TaskSubscriberWithFilter>();
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

    // If there is a waitUntil date, set the status to Waiting
    if (task.waitUntil) {
      task.status = TaskStatus.Waiting;
    }

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

    // If the task has no completedAt date, but the status is done, set completedAt to now
    if (updatedTask.status === TaskStatus.Done && !updatedTask.completedAt) {
      updatedTask.completedAt = new Date();
    }

    // If the task has a completedAt date, but the status is started or ready, remove completedAt
    if (
      (updatedTask.status === TaskStatus.Started || updatedTask.status === TaskStatus.Ready) &&
      updatedTask.completedAt
    ) {
      delete updatedTask.completedAt;
    }

    // If there is a waitUntil date and the date is not yet met, set the status to Waiting
    if (updatedTask.waitUntil && new Date(updatedTask.waitUntil) > new Date()) {
      updatedTask.status = TaskStatus.Waiting;
    }

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
   * Do a one-time fetch of tasks based on the provided parameters.
   *
   * @param filter
   */
  async getTasks(filter: TaskFilter): Promise<Task[]> {
    Logger.info('Getting tasks');
    const allTasks = await this.getAllTasks();

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

    const filteredTasks = this.filterTasks(allTasks, filter);
    return await this.sortTasks(filteredTasks);
  }

  async getAllTasks(): Promise<Task[]> {
    const result = await this.db.allDocs<Task>({
      include_docs: true,
      startkey: 'task-',
      endkey: 'task-\ufff0',
    });

    return result.rows.map((row) => row.doc as Task);
  }

  /**
   * Filter tasks based on the provided getTaskParams object.
   *
   * @param tasks
   * @param filter
   */
  filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
    const taskFilterer = new TaskFilterer(filter);
    return taskFilterer.filterTasks(tasks);
  }

  /**
   * Sort tasks based on their urgency, which is calculated using the user's preferences.
   *
   * @param tasks
   */
  async sortTasks(tasks: Task[]): Promise<Task[]> {
    const preferencesRepository = new PreferencesRepository(this.db);
    const preferences = await preferencesRepository.getPreferences();
    const calculator = new UrgencyCalculator(preferences);
    const tasksWithUrgency = tasks.map((task) => ({
      ...task,
      urgency: calculator.getUrgency(task),
    }));

    const sorted = tasksWithUrgency.sort((a, b) => b.urgency - a.urgency);

    // Remove urgency from the tasks
    return sorted.map((task) => {
      const { urgency, ...taskWithoutUrgency } = task;
      return taskWithoutUrgency;
    });
  }

  /**
   * Clean a tag by removing leading/trailing whitespace or leading # character.
   *
   * @param tag
   */
  cleanTag(tag: string): string {
    // Remove leading/trailing whitespace
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
   * @param filter
   * @param callback
   *
   * @return A function to unsubscribe from the changes feed.
   */
  subscribeToTasks(filter: TaskFilter, callback: (tasks: Task[]) => void): UnsubscribeFunction {
    // Register the callback so that we can notify it of changes
    this.taskChangeSubscribers.add({ callback, params: filter });

    // Set up the PouchDB changes feed if this is the first subscriber
    if (this.taskChangeSubscribers.size === 1) {
      this.initializeTaskChangesFeed();
    }

    // Provide the initial tasks to the callback
    this.getTasks(filter)
      .then((tasks) => callback(tasks))
      .catch((error) => {
        Logger.error('Error fetching initial tasks for watcher:', error);
      });

    // Return an unsubscribe function
    return () => this.removeTaskSubscriber({ callback, params: filter });
  }

  /**
   * This function will look for tasks that have a waitUntil date that is today or in the past,
   * and then update their status to TaskStatus.Ready if they are not already.
   */
  async checkWaitingTasks(): Promise<void> {
    Logger.info('Checking for waiting tasks to update to ready status');

    const waitingTasks = await this.getTasks({ statuses: [TaskStatus.Waiting] });
    const now = new Date();
    const tasksToUpdate = waitingTasks.filter((task) => {
      return task.waitUntil && new Date(task.waitUntil) <= now && task.status !== TaskStatus.Ready;
    });

    if (tasksToUpdate.length > 0) {
      Logger.info(`Updating ${tasksToUpdate.length} waiting tasks to ready status`);
      await Promise.all(
        tasksToUpdate.map((task) => this.updateTask({ ...task, status: TaskStatus.Ready }))
      );
    }
  }

  /**
   * This function will check for tasks that have a recurrence set
   *  and create new instances of them, if appropriate
   */
  async checkRecurringTasks(currentDate?: Date): Promise<void> {
    Logger.info('Checking for recurring tasks to create new instances');

    const now = currentDate ? new Date(currentDate) : new Date();

    const recurringTasks = await this.getTasks({ statuses: [TaskStatus.Recurring] });
    await Promise.all(recurringTasks.map((task) => this.createRecurringTaskInstances(task, now)));
  }

  private async createRecurringTaskInstances(task: Task, now: Date): Promise<void> {
    if (!task.recurrence) {
      throw new Error('Task is not recurring');
    }

    // Get all occurrences of this task
    const occurrences = await this.getOccurrencesFromRecurringTask(task);

    // If we have an open task (status of TaskStatus.Ready or TaskStatus.Started), do not create a new instance
    if (
      occurrences.some(({ status }) => status === TaskStatus.Ready || status === TaskStatus.Started)
    ) {
      Logger.info(
        `Skipping creation of new instance for recurring task ${task._id} as it already has an open instance`
      );
      return;
    }
    // If we have a task completed today, do not create a new instance
    if (
      occurrences.some(
        ({ completedAt }) =>
          completedAt && new Date(completedAt).toDateString() === now.toDateString()
      )
    ) {
      Logger.info(
        `Skipping creation of new instance for recurring task ${task._id} as it was completed today`
      );
      return;
    }

    // Check if recurrence has ended
    if (this.hasRecurrenceEnded(task, occurrences, now)) {
      Logger.info(`Recurrence for task ${task._id} has ended, not creating new instance`);
      return;
    }

    // Get the timestamp when the last occurrence was completed
    const completedOccurrences = occurrences.filter((occurrence) => occurrence.completedAt);

    let shouldCreateTask = false;

    if (task.recurrence.frequency === 'daily') {
      if (completedOccurrences.length === 0) {
        // For daily tasks, create the first instance immediately
        shouldCreateTask = true;
      } else {
        const lastOccurrence = completedOccurrences.sort(
          (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
        )[0];
        const lastOccurrenceDate = new Date(lastOccurrence.completedAt!);

        const days = task.recurrence.interval;
        const nextOccurrenceDate = new Date(lastOccurrenceDate);
        nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + days);

        if (nextOccurrenceDate <= now) {
          shouldCreateTask = true;
        }
      }
    } else if (task.recurrence.frequency === 'weekly') {
      const weeks = task.recurrence.interval;
      const dayOfWeek = task.recurrence.dayOfWeek;

      if (dayOfWeek === undefined) {
        throw new Error('dayOfWeek is required for weekly recurring tasks');
      }

      // Check if today is the specified day of the week
      const currentDayOfWeek = now.getUTCDay();
      if (currentDayOfWeek !== dayOfWeek) {
        return; // Not the day when this task should recur
      }

      if (completedOccurrences.length === 0) {
        // For weekly tasks, create the first instance if today matches the day of week
        shouldCreateTask = true;
      } else {
        const lastOccurrence = completedOccurrences.sort(
          (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
        )[0];
        const lastOccurrenceDate = new Date(lastOccurrence.completedAt!);

        // Calculate if enough weeks have passed since the last occurrence
        const timeDifference = now.getTime() - lastOccurrenceDate.getTime();
        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const weeksSinceLastOccurrence = Math.floor(daysDifference / 7);

        if (weeksSinceLastOccurrence >= weeks) {
          shouldCreateTask = true;
        }
      }
    } else if (task.recurrence.frequency === 'monthly') {
      const months = task.recurrence.interval;
      const dayOfMonth = task.recurrence.dayOfMonth;

      if (!dayOfMonth) {
        throw new Error('dayOfMonth is required for monthly recurring tasks');
      }

      // Get the target day for this month
      const currentMonth = now.getUTCMonth();
      const currentYear = now.getUTCFullYear();

      // Handle case where dayOfMonth doesn't exist in current month (e.g., Feb 31st)
      const daysInCurrentMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
      const targetDay = Math.min(dayOfMonth, daysInCurrentMonth);

      const targetDate = new Date(Date.UTC(currentYear, currentMonth, targetDay));

      // Check if today is the target day or later
      if (now >= targetDate) {
        if (completedOccurrences.length === 0) {
          // For monthly tasks, create the first instance if today matches the day of month
          shouldCreateTask = true;
        } else {
          const lastOccurrence = completedOccurrences.sort(
            (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
          )[0];
          const lastOccurrenceDate = new Date(lastOccurrence.completedAt!);

          // Calculate months since last occurrence
          const lastMonth = lastOccurrenceDate.getUTCMonth();
          const lastYear = lastOccurrenceDate.getUTCFullYear();

          const monthsSinceLastOccurrence =
            (currentYear - lastYear) * 12 + (currentMonth - lastMonth);

          if (monthsSinceLastOccurrence >= months) {
            shouldCreateTask = true;
          }
        }
      }
    } else if (task.recurrence.frequency === 'yearly') {
      const years = task.recurrence.interval;
      const yearlyFirstOccurrence = task.recurrence.yearlyFirstOccurrence;

      if (!yearlyFirstOccurrence) {
        throw new Error('yearlyFirstOccurrence is required for yearly recurring tasks');
      }

      const firstOccurrenceDate = new Date(yearlyFirstOccurrence);
      const currentYear = now.getUTCFullYear();

      // Create target date for this year
      const targetDate = new Date(
        Date.UTC(currentYear, firstOccurrenceDate.getUTCMonth(), firstOccurrenceDate.getUTCDate())
      );

      // Check if today is the target date or later
      if (now >= targetDate) {
        if (completedOccurrences.length === 0) {
          // For yearly tasks, create the first instance if today matches the yearly date
          shouldCreateTask = true;
        } else {
          const lastOccurrence = completedOccurrences.sort(
            (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
          )[0];
          const lastOccurrenceDate = new Date(lastOccurrence.completedAt!);

          // Calculate years since last occurrence
          const lastYear = lastOccurrenceDate.getUTCFullYear();
          const yearsSinceLastOccurrence = currentYear - lastYear;

          if (yearsSinceLastOccurrence >= years) {
            shouldCreateTask = true;
          }
        }
      }
    }

    if (shouldCreateTask) {
      await this.createTaskFromTemplate(task);
    }
  }
  private hasRecurrenceEnded(task: Task, occurrences: Task[], now: Date): boolean {
    if (!task.recurrence?.ends) {
      return false;
    }

    const { afterOccurrences, onDate } = task.recurrence.ends;

    // Check if ended by number of occurrences
    if (afterOccurrences) {
      const completedOccurrences = occurrences.filter((o) => o.completedAt).length;
      if (completedOccurrences >= afterOccurrences) {
        return true;
      }
    }

    // Check if ended by date
    if (onDate) {
      const endDate = new Date(onDate);
      if (now >= endDate) {
        return true;
      }
    }

    return false;
  }

  private async createTaskFromTemplate(template: Task): Promise<Task> {
    const { _id, _rev, ...templateData } = template;

    const newTask: NewTask & { recurrenceTemplateId: string } = {
      ...templateData,
      status: TaskStatus.Ready,
      recurrenceTemplateId: template._id,
      recurrence: undefined, // Remove recurrence from the spawned task
    };

    return await this.addTask(newTask as Task);
  }

  /**
   * This function will find instances of a recurring task and return them.
   */
  async getOccurrencesFromRecurringTask(task: Task): Promise<Task[]> {
    if (!task.recurrence) {
      throw new Error('Task is not recurring');
    }

    const allDocsResult = await this.db.allDocs<Task>({
      include_docs: true,
      startkey: 'task-',
      endkey: 'task-\ufff0',
    });

    const allTasks = allDocsResult.rows.map((row) => row.doc as Task);

    // Filter the results in memory
    return allTasks.filter((doc) => doc.recurrenceTemplateId === task._id);
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
  private removeTaskSubscriber(subscriber: TaskSubscriberWithFilter): void {
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
    this.taskChangeSubscribers.forEach((taskSubscriber: TaskSubscriberWithFilter) => {
      try {
        const tasksToNotify = this.filterTasks(tasks, taskSubscriber.params);
        taskSubscriber.callback(tasksToNotify);
      } catch (error) {
        // TODO
        Logger.error('Error notifying task change subscriber:', error);
      }
    });
  }
}
