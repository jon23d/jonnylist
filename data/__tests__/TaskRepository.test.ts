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
});
