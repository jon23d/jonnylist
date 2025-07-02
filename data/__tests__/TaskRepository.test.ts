import { TaskRepository } from '@/data/TaskRepository';
import { generateKeyBetween, generateNKeysBetween } from '@/helpers/fractionalIndexing';
import { setupTestDatabase } from '@/test-utils/db';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { DocumentTypes } from '../documentTypes';
import { Task, TaskPriority, TaskStatus } from '../documentTypes/Task';

describe('DataSource', () => {
  const { getDb } = setupTestDatabase();

  test('addTask should add a task to the database', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);

    const task = taskFactory({
      sortOrder: 'a',
      priority: TaskPriority.High,
    });

    await repository.addTask(task);

    const tasks = await database.allDocs({ include_docs: true });
    expect(tasks.rows).toHaveLength(1);

    const returnedTask = tasks.rows[0].doc as Task;

    const expectedSort = generateKeyBetween(null, null);

    expect(returnedTask.context).toEqual(task.context);
    expect(returnedTask._id.startsWith('task-')).toBe(true);
    expect(returnedTask.priority).toBe(TaskPriority.High);
    expect(returnedTask.sortOrder).toBe(expectedSort);
  });

  test('addTask should append the _rev to the task', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);
    const task = taskFactory({
      context: 'context1',
    });

    const addedTask = await repository.addTask(task);

    expect(addedTask._rev).toBeDefined();
    expect(addedTask._id.startsWith('task-')).toBe(true);

    const tasks = await repository.getTasks({ context: 'context1' });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]._rev).toBe(addedTask._rev);
  });

  test('addTask should clean tags', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);

    const newTask = taskFactory({
      context: 'context1',
      tags: ['#tag1'], // no # allowed at start of string
    });

    const addedTask = await repository.addTask(newTask);

    expect(addedTask.tags).toEqual(['tag1']);
  });

  test('updateTask should update an existing task in the database', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);
    const newTask = taskFactory({
      context: 'context1',
      sortOrder: 'a',
    });

    const task = await repository.addTask(newTask);
    const timeAfterUpdate = new Date();

    const updatedTask = await repository.updateTask({ ...task, sortOrder: 'z' });

    expect(updatedTask.sortOrder).toBe('z');

    const tasks = await repository.getTasks({ context: 'context1' });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].sortOrder).toBe('z');
    expect(tasks[0].updatedAt.getTime()).toBeGreaterThanOrEqual(timeAfterUpdate.getTime());
  });

  test('updateTasks should update multiple tasks in the database', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);

    const task1 = await repository.addTask(taskFactory({ sortOrder: 'a' }));
    const task2 = await repository.addTask(taskFactory({ sortOrder: 'g' }));

    const rev1 = task1._rev;
    const rev2 = task2._rev;

    task1.sortOrder = 'b';
    task2.sortOrder = 'h';

    const updatedTasks = await repository.updateTasks([task1, task2]);

    expect(updatedTasks).toHaveLength(2);
    expect(updatedTasks[0].sortOrder).toBe('b');
    expect(updatedTasks[1].sortOrder).toBe('h');
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

    const task1 = taskFactory({ context: 'context1' });

    await repository.addTask(task1);

    const filterMock = jest.spyOn(repository, 'filterTasksByParams').mockReturnValue([]);

    const tasks = await repository.getTasks({
      context: 'context1',
      statuses: [],
    });

    expect(tasks).toHaveLength(0);
    expect(filterMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'task',
          context: 'context1',
        }),
      ]),
      {
        context: 'context1',
        statuses: [],
      }
    );
  });

  test('getTasks should return tasks sorted by sortOrder', async () => {
    const database = getDb();
    const repository = new TaskRepository(database);

    const sorts = generateNKeysBetween(null, null, 3);
    // out of order tasks
    const task1 = taskFactory({ _id: 'task1', context: 'context1', sortOrder: sorts[1] });
    const task2 = taskFactory({ _id: 'task2', context: 'context1', sortOrder: sorts[0] });
    const task3 = taskFactory({ _id: 'task3', context: 'context1', sortOrder: sorts[2] });

    await repository.addTask(task1);
    await repository.addTask(task2);
    await repository.addTask(task3);

    const tasks = await repository.getTasks({ context: 'context1' });

    expect(tasks).toHaveLength(3);
    expect(tasks[0].sortOrder).toBe(sorts[0]); // task 2
    expect(tasks[1].sortOrder).toBe(sorts[1]); // task 1
    expect(tasks[2].sortOrder).toBe(sorts[2]); // task 3
  });

  describe('filterTasksByParams', () => {
    it('Should filter tasks by context and statuses', () => {
      const database = getDb();
      const repository = new TaskRepository(database);

      const tasks: Task[] = [
        taskFactory({ context: 'context1', status: TaskStatus.Ready }),
        taskFactory({ context: 'context1', status: TaskStatus.Started }),
        taskFactory({ context: 'context2', status: TaskStatus.Waiting }),
        taskFactory({ context: 'context2', status: TaskStatus.Done }),
      ];

      const filteredTasks = repository.filterTasksByParams(tasks, {
        context: 'context1',
        statuses: [TaskStatus.Started, TaskStatus.Waiting],
      });

      expect(filteredTasks).toHaveLength(1);
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
});
