import { waitFor } from '@testing-library/react';
import { TaskRepository } from '@/data/TaskRepository';
import { setupTestDatabase } from '@/test-utils/db';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { DocumentTypes } from '../documentTypes';
import { Task, TaskPriority, TaskStatus } from '../documentTypes/Task';

describe('TaskRepository', () => {
  const { getDb } = setupTestDatabase();

  test('addTask should add a task to the database', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);

    const task = taskFactory({
      priority: TaskPriority.High,
      project: 'a project',
    });

    await repository.addTask(task);

    const tasks = await database.allDocs({ include_docs: true });
    expect(tasks.rows).toHaveLength(1);

    const returnedTask = tasks.rows[0].doc as Task;

    expect(returnedTask._id.startsWith('task-')).toBe(true);
    expect(returnedTask.priority).toBe(TaskPriority.High);
    expect(returnedTask.project).toBe('a project');
  });

  test('addTask should append the _rev to the task', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);
    const task = taskFactory({});

    const addedTask = await repository.addTask(task);

    expect(addedTask._rev).toBeDefined();
    expect(addedTask._id.startsWith('task-')).toBe(true);

    const tasks = await repository.getTasks({});
    expect(tasks).toHaveLength(1);
    expect(tasks[0]._rev).toBe(addedTask._rev);
  });

  test('addTask should clean tags', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);

    const newTask = taskFactory({
      tags: ['#tag1'], // no # allowed at start of string
    });

    const addedTask = await repository.addTask(newTask);

    expect(addedTask.tags).toEqual(['tag1']);
  });

  test('updateTask should clean tags', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);

    const newTask = taskFactory({});

    const task = await repository.addTask(newTask);
    const updatedTask = await repository.updateTask({ ...task, tags: ['#tag2'] });

    expect(updatedTask.tags).toEqual(['tag2']);
  });

  test('updateTask should update an existing task in the database', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);
    const newTask = taskFactory({
      project: 'world domination',
    });

    const task = await repository.addTask(newTask);
    const timeAfterUpdate = new Date();

    await repository.updateTask({ ...task, project: 'county domination' });

    const tasks = await repository.getTasks({});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].project).toBe('county domination');
    expect(tasks[0].updatedAt.getTime()).toBeGreaterThanOrEqual(timeAfterUpdate.getTime());
  });

  test('updateTasks should update multiple tasks in the database', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);

    const task1 = await repository.addTask(taskFactory());
    const task2 = await repository.addTask(taskFactory());

    const rev1 = task1._rev;
    const rev2 = task2._rev;

    task1.title = 'foo1';
    task2.title = 'foo2';

    const updatedTasks = await repository.updateTasks([task1, task2]);

    expect(updatedTasks).toHaveLength(2);
    expect(updatedTasks[0].title).toBe('foo1');
    expect(updatedTasks[1].title).toBe('foo2');
    expect(updatedTasks[0]._rev).not.toBe(rev1);
    expect(updatedTasks[1]._rev).not.toBe(rev2);
  });

  test('UpdateTask should return the task with the new revision', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);
    const newTask = taskFactory({});

    const task = await repository.addTask(newTask);
    const updatedTask = await repository.updateTask({ ...task, title: 'Updated Task' });

    expect(task._rev).not.toEqual(updatedTask._rev);
    expect(updatedTask.title).toBe('Updated Task');
    expect(updatedTask._rev).toBeDefined();
  });

  test('getTasks should use a high unicode value for the endkey', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);

    // @ts-ignore: Accessing protected member for testing purposes
    repository.db = {
      allDocs: jest.fn().mockResolvedValue({
        rows: [],
      }),
    } as unknown as PouchDB.Database<DocumentTypes>;

    await repository.getTasks({});

    // @ts-ignore: Accessing protected member for testing purposes
    expect(repository.db.allDocs).toHaveBeenCalledWith({
      startkey: 'task-',
      endkey: 'task-\ufff0',
      include_docs: true,
    });
  });

  test('getTasks should return tasks filtered', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);

    const task1 = taskFactory({});

    await repository.addTask(task1);

    const filterMock = jest.spyOn(repository, 'filterTasksByParams').mockReturnValue([]);

    const tasks = await repository.getTasks({
      statuses: [],
    });

    expect(tasks).toHaveLength(0);
    expect(filterMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'task',
        }),
      ]),
      {
        statuses: [],
      }
    );
  });

  describe('filterTasksByParams', () => {
    it('Should filter tasks statuses', () => {
      const database = getDb();
      const repository = new TaskRepository(database);

      const tasks: Task[] = [
        taskFactory({ status: TaskStatus.Ready }),
        taskFactory({ status: TaskStatus.Started }),
        taskFactory({ status: TaskStatus.Waiting }),
        taskFactory({ status: TaskStatus.Done }),
      ];

      const filteredTasks = repository.filterTasksByParams(tasks, {
        statuses: [TaskStatus.Started, TaskStatus.Waiting],
      });

      expect(filteredTasks).toHaveLength(2);
      expect(filteredTasks[0].status).toBe(TaskStatus.Started);
    });

    it('Should should filter by multiple statuses', () => {
      const database = getDb();
      const repository = new TaskRepository(database);

      const tasks: Task[] = [
        taskFactory({ status: TaskStatus.Ready }),
        taskFactory({ status: TaskStatus.Started }),
        taskFactory({ status: TaskStatus.Waiting }),
        taskFactory({ status: TaskStatus.Done }),
      ];

      const filteredTasks = repository.filterTasksByParams(tasks, {
        statuses: [TaskStatus.Ready, TaskStatus.Started],
      });

      expect(filteredTasks).toHaveLength(2);
      expect(filteredTasks[0].status).toBe(TaskStatus.Ready);
      expect(filteredTasks[1].status).toBe(TaskStatus.Started);
    });

    it('Should should filter by a single status', () => {
      const database = getDb();
      const repository = new TaskRepository(database);

      const filteredTasks = repository.filterTasksByParams(
        [taskFactory({ status: TaskStatus.Started })],
        { statuses: [TaskStatus.Started] }
      );

      expect(filteredTasks).toHaveLength(1);
    });

    it('Should return all tasks if no filters are applied', () => {
      const database = getDb();
      const repository = new TaskRepository(database);

      const tasks: Task[] = [
        taskFactory({ status: TaskStatus.Ready }),
        taskFactory({ status: TaskStatus.Started }),
        taskFactory({ status: TaskStatus.Waiting }),
        taskFactory({ status: TaskStatus.Done }),
      ];

      const filteredTasks = repository.filterTasksByParams(tasks, {});

      expect(filteredTasks).toHaveLength(4);
    });
  });

  test('subscribeToTasks should register a task change subscriber', async () => {
    const taskRepository = new TaskRepository(getDb());

    const subscriber = jest.fn();

    taskRepository.subscribeToTasks({}, subscriber);

    // The subscriber should be called with the tasks right away
    await waitFor(() => {
      expect(subscriber).toHaveBeenCalled();
    });
  });

  test('subscribeToTasks should stop callback when unsubscribe is called', async () => {
    const taskRepository = new TaskRepository(getDb());

    const subscriber = jest.fn();
    const subscriber2 = jest.fn();

    const unsubscribe = taskRepository.subscribeToTasks({}, subscriber);
    taskRepository.subscribeToTasks({}, subscriber2);

    await waitFor(() => {
      // The subscriber should be called with the tasks right away
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    unsubscribe();
    subscriber.mockReset();

    await taskRepository.addTask(taskFactory({}));

    await waitFor(() => {
      expect(subscriber).not.toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });
  });

  test('checkWaitingTasks should update waiting tasks to ready status', async () => {
    const taskRepository = new TaskRepository(getDb());

    // Create a waiting task with a waitUntil date in the past
    const waitingTask = taskFactory({
      status: TaskStatus.Waiting,
      title: 'Waiting task',
      waitUntil: new Date(Date.now() - 1000).toISOString(), // 1 second in the past
    });
    // Create one a day in the future
    const futureTask = taskFactory({
      status: TaskStatus.Waiting,
      title: 'Future task',
      waitUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day in the future
    });

    await taskRepository.addTask(waitingTask);
    await taskRepository.addTask(futureTask);

    // Check waiting tasks and update them
    taskRepository.checkWaitingTasks().then(async () => {
      // Fetch tasks to verify the update
      const tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });

      expect(tasks).toHaveLength(1);
      expect(tasks[0].status).toBe(TaskStatus.Ready);
      expect(tasks[0].title).toBe('Waiting task');
    });
  });

  describe('getOccurrencesFromRecurringTask', () => {
    it('Gets all occurrences for a recurring task', async () => {
      const taskRepository = new TaskRepository(getDb());
      const task = await taskRepository.addTask(
        taskFactory({
          recurrence: {
            frequency: 'daily',
            interval: 1,
          },
        })
      );
      await taskRepository.addTask(
        taskFactory({
          recurrenceTemplateId: task._id,
        })
      );

      const occurrences = await taskRepository.getOccurrencesFromRecurringTask(task);
      expect(occurrences).toHaveLength(1);
    });

    it('Throws an error if the task is not recurring', async () => {
      const taskRepository = new TaskRepository(getDb());
      const task = await taskRepository.addTask(taskFactory({}));

      await expect(taskRepository.getOccurrencesFromRecurringTask(task)).rejects.toThrow(
        'Task is not recurring'
      );
    });
  });

  describe('checkRecurringTasks', () => {
    it('Creates a new task for a daily recurring task every day', async () => {
      // Create the recurring task template
      const taskRepository = new TaskRepository(getDb());
      await taskRepository.addTask(
        taskFactory({
          recurrence: {
            frequency: 'daily',
            interval: 1,
          },
        })
      );

      // This should create a new task from the template
      await taskRepository.checkRecurringTasks();

      // Did it?
      let tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);

      // Great, now let's update the template to mark it as done
      await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });

      // Now let's check again, it should not create a new task because time hasn't passed
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(0);

      // Let's advance time to the next day using jest.setSystemTime
      jest.setSystemTime(new Date(Date.now() + 24 * 60 * 60 * 1000));

      // And now we should see another new task created
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);
    });

    it('Does not create a new task from a template if a spawned one has a started status', async () => {
      // Create the recurring task template
      const taskRepository = new TaskRepository(getDb());
      const template = taskFactory({
        recurrence: {
          frequency: 'daily',
          interval: 1,
        },
      });
      await taskRepository.addTask(template);

      // This should create a new task from the template
      await taskRepository.checkRecurringTasks();

      // Did it?
      let tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);

      // Now let's update the spawned task to be in-progress
      await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Started });

      // Let's advance time to the next day using jest.setSystemTime
      jest.setSystemTime(new Date(Date.now() + 24 * 60 * 60 * 1000));

      // Now it should NOT create a new task because the spawned one is still in-progress
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(0);
    });

    it('Does not create a new task from a template if a spawned one has a ready status', async () => {
      // Create the recurring task template
      const taskRepository = new TaskRepository(getDb());
      const template = taskFactory({
        recurrence: {
          frequency: 'daily',
          interval: 1,
        },
      });
      await taskRepository.addTask(template);

      // This should create a new task from the template
      await taskRepository.checkRecurringTasks();

      // Did it?
      let tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);

      // Let's advance time to the next day using jest.setSystemTime
      jest.setSystemTime(new Date(Date.now() + 24 * 60 * 60 * 1000));

      // Now it should NOT create a new task because the spawned one is still in-progress
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);
    });

    it('Honors interval for daily recurring tasks', async () => {
      // Create the recurring task template
      const taskRepository = new TaskRepository(getDb());
      const template = taskFactory({
        recurrence: {
          frequency: 'daily',
          interval: 2,
        },
      });
      await taskRepository.addTask(template);

      // This should create a new task from the template
      await taskRepository.checkRecurringTasks();

      // Did it?
      let tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);

      // Mark the task as done
      await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });

      // Advance time by 1 day
      jest.setSystemTime(new Date(Date.now() + 24 * 60 * 60 * 1000));

      // Check again, it should not create a new task because the interval is 2 days
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(0);

      // Advance time by another day
      jest.setSystemTime(new Date(Date.now() + 24 * 60 * 60 * 1000));

      // Now it should create a new task
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);
    });

    it('Honors frequency and day of week for weekly recurring tasks', async () => {
      // Create the recurring task template
      const taskRepository = new TaskRepository(getDb());
      const template = taskFactory({
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          dayOfWeek: [1, 3], // Monday and Wednesday
        },
      });
      await taskRepository.addTask(template);

      // Let's set the day of the week to Sunday, where no new task should be created
      jest.setSystemTime(new Date('2023-10-01T00:00:00Z')); // This is a Sunday
      await taskRepository.checkRecurringTasks();
      let tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(0);

      // Now, let's advance to Monday, where a new task should be created
      jest.setSystemTime(new Date('2023-10-02T00:00:00Z')); // This is a Monday
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);

      // Fantastic! Let's mark the task as done and advance to Tuesday, where no new task should be created
      await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });
      jest.setSystemTime(new Date('2023-10-03T00:00:00Z')); // This is a Tuesday
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(0);

      // And now, let's advance to Wednesday, where a new task should be created
      jest.setSystemTime(new Date('2023-10-04T00:00:00Z')); // This is a Wednesday
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);
    });

    it('Honors interval and day of month for monthly recurring tasks', async () => {
      // Create the recurring task template
      const taskRepository = new TaskRepository(getDb());
      const template = taskFactory({
        recurrence: {
          frequency: 'monthly',
          interval: 2,
          dayOfMonth: 15,
        },
      });
      await taskRepository.addTask(template);

      // Let's set the date to the 14th, where no new task should be created
      jest.setSystemTime(new Date('2023-10-14T00:00:00Z')); // This is the 14th of October
      await taskRepository.checkRecurringTasks();
      let tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(0);

      // Let's advance to the 15th, where a new task should be created
      jest.setSystemTime(new Date('2023-10-15T00:00:00Z')); // This is the 15th of October
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);

      // Close the task, and advance to the next month on the 15th, where NO new task should be created
      // because of the interval
      await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });
      jest.setSystemTime(new Date('2023-11-15T00:00:00Z')); // This is the 15th of November
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(0);

      // Move to the 15th of January, where a new task should be created
      jest.setSystemTime(new Date('2024-01-15T00:00:00Z')); // This is the 15th of January
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);
    });

    it(
      'Deals with with monthly recurring tasks that have a day' +
        'of month that does not exist in the current month',
      async () => {
        // Create the recurring task template
        const taskRepository = new TaskRepository(getDb());
        const template = taskFactory({
          recurrence: {
            frequency: 'monthly',
            interval: 1,
            dayOfMonth: 31,
          },
        });
        await taskRepository.addTask(template);

        // It should create a task on the 31st of January
        jest.setSystemTime(new Date('2024-01-31T00:00:00Z'));
        await taskRepository.checkRecurringTasks();
        let tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
        expect(tasks).toHaveLength(1);

        // Close it, and move to the 29th of February, where a new task should be created because
        // the 31st does not exist in February, and the 29th is the last day of the month
        await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });
        jest.setSystemTime(new Date('2024-02-29T00:00:00Z'));
        await taskRepository.checkRecurringTasks();
        tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
        expect(tasks).toHaveLength(1);

        // Close it, and advance to november 2024, which has 30 days, so a new task should be created
        await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });
        jest.setSystemTime(new Date('2024-11-30T00:00:00Z'));
        await taskRepository.checkRecurringTasks();
        tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
        expect(tasks).toHaveLength(1);

        // Close it, and advance to feb 28, 2025, the last day of the month, so a new task should be created
        await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });
        jest.setSystemTime(new Date('2025-02-28T00:00:00Z'));
        await taskRepository.checkRecurringTasks();
        tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
        expect(tasks).toHaveLength(1);
      }
    );

    it('Honors interval for yearly recurring tasks', async () => {
      // Create the recurring task template
      const taskRepository = new TaskRepository(getDb());
      const template = taskFactory({
        recurrence: {
          frequency: 'yearly',
          interval: 2,
          yearlyFirstOccurrence: '2024-12-30',
        },
      });
      await taskRepository.addTask(template);

      // Set the date to 12/30/2023, where a new task should be created
      jest.setSystemTime(new Date('2023-12-30T00:00:00Z'));
      await taskRepository.checkRecurringTasks();
      let tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);

      // Mark the task as done and advance one year. A new one should not be created because the interval is 2 years
      await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });
      jest.setSystemTime(new Date('2024-12-30T00:00:00Z'));
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(0);

      // Advance to 2025, where a new task should be created
      jest.setSystemTime(new Date('2025-12-30T00:00:00Z'));
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);
    });

    it('Honors ends after number of occurrences', async () => {
      // Create the recurring task template
      const taskRepository = new TaskRepository(getDb());
      const template = taskFactory({
        recurrence: {
          frequency: 'daily',
          interval: 1,
          ends: {
            afterOccurrences: 3,
          },
        },
      });
      await taskRepository.addTask(template);

      // The first one
      await taskRepository.checkRecurringTasks();
      let tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);

      // The second one
      await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });
      jest.setSystemTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);

      // The third one
      await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });
      jest.setSystemTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);

      // The fourth one should not be created
      await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });
      jest.setSystemTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(0);
    });

    it('Honors ends on date ', async () => {
      // Create the recurring task template
      const taskRepository = new TaskRepository(getDb());
      const template = taskFactory({
        recurrence: {
          frequency: 'daily',
          interval: 1,
          ends: {
            onDate: '2024-01-01',
          },
        },
      });
      await taskRepository.addTask(template);

      // The first one
      jest.setSystemTime(new Date('2023-12-30T00:00:00Z'));
      await taskRepository.checkRecurringTasks();
      let tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);

      // The second one
      await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });
      jest.setSystemTime(new Date('2023-12-31T00:00:00Z'));
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(1);

      // The third one should not be created because it ends on 2024-01-01
      await taskRepository.updateTask({ ...tasks[0], status: TaskStatus.Done });
      jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      await taskRepository.checkRecurringTasks();
      tasks = await taskRepository.getTasks({ statuses: [TaskStatus.Ready] });
      expect(tasks).toHaveLength(0);
    });
  });
});
