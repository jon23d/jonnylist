import { waitFor } from '@testing-library/dom';
import { Preferences } from '@/data/documentTypes/Preferences';
import { LocalDataSource } from '@/data/LocalDataSource';
import { createTestLocalDataSource } from '@/test-utils/db';
import { ContextFactory } from '@/test-utils/factories/ContextFactory';
import { PreferencesFactory } from '@/test-utils/factories/PreferencesFactory';
import { TaskFactory } from '@/test-utils/factories/TaskFactory';
import { DocumentTypes } from '../documentTypes';
import { Task, TaskStatus } from '../documentTypes/Task';
import { MigrationManager } from '../migrations/MigrationManager';

jest.mock('@/data/documentTypes/Preferences', () => ({
  createDefaultPreferences: jest.fn(() => ({
    lastSelectedContext: 'context1',
  })),
}));

describe('LocalDataSource', () => {
  let localDataSource: LocalDataSource;
  let database: PouchDB.Database<DocumentTypes>;
  const contextFactory = new ContextFactory();
  const taskFactory = new TaskFactory();

  beforeEach(() => {
    const testData = createTestLocalDataSource();
    localDataSource = testData.dataSource;
    database = testData.database;
  });

  afterEach(async () => {
    await localDataSource.cleanup();
    await database.destroy();
  });

  it('should initialize with an empty database', async () => {
    const contexts = await localDataSource.getContexts();
    expect(contexts).toEqual([]);
  });

  test('getPreferences should return default preferences', async () => {
    const preferences = await localDataSource.getPreferences();
    expect(preferences).toEqual({
      lastSelectedContext: 'context1',
    });
  });

  test('getPreferences should return stored preferences', async () => {
    await database.post<Preferences>(
      new PreferencesFactory().create({
        lastSelectedContext: 'context1',
      })
    );

    const preferences = await localDataSource.getPreferences();
    expect(preferences.lastSelectedContext).toBe('context1');
  });

  test('setPreferences should create new preferences in the database', async () => {
    const newPreferences = new PreferencesFactory().create({
      lastSelectedContext: 'foo-context',
    });

    await localDataSource.setPreferences(newPreferences);

    const preferences = await localDataSource.getPreferences();
    expect(preferences.lastSelectedContext).toBe('foo-context');
  });

  test('setPreferences should update existing preferences', async () => {
    const newPreferences = new PreferencesFactory().create({
      lastSelectedContext: 'foo-context',
    });

    await localDataSource.setPreferences(newPreferences);

    const preferences = await localDataSource.getPreferences();
    expect(preferences.lastSelectedContext).toBe('foo-context');

    preferences.lastSelectedContext = 'poo-context';
    await localDataSource.setPreferences(preferences);

    const updatedPreferences = await localDataSource.getPreferences();
    expect(updatedPreferences.lastSelectedContext).toBe('poo-context');
  });

  test('addTask should add a task to the database', async () => {
    const task = taskFactory.create({
      sortOrder: 100,
    });

    await localDataSource.addTask(task);

    const tasks = await database.allDocs({ include_docs: true });
    expect(tasks.rows).toHaveLength(1);

    const returnedTask = tasks.rows[0].doc as Task;

    expect(returnedTask.context).toEqual(task.context);
    expect(returnedTask._id.startsWith('task-')).toBe(true);
    expect(returnedTask.sortOrder).toBe(100);
  });

  test('addTask should append the _rev to the task', async () => {
    const task = taskFactory.create({
      context: 'context1',
      sortOrder: 100,
    });

    const addedTask = await localDataSource.addTask(task);

    expect(addedTask._rev).toBeDefined();
    expect(addedTask._id.startsWith('task-')).toBe(true);

    const tasks = await localDataSource.getTasks({ context: 'context1' });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]._rev).toBe(addedTask._rev);
  });

  test('updateTask should update an existing task in the database', async () => {
    const newTask = taskFactory.create({
      context: 'context1',
      sortOrder: 100,
    });

    const task = await localDataSource.addTask(newTask);
    const timeAfterUpdate = new Date();

    task.sortOrder = 200;
    const updatedTask = await localDataSource.updateTask(task);

    expect(updatedTask.sortOrder).toBe(200);

    const tasks = await localDataSource.getTasks({ context: 'context1' });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].sortOrder).toBe(200);
    expect(tasks[0].updatedAt.getTime()).toBeGreaterThanOrEqual(timeAfterUpdate.getTime());
  });

  test('updateTasks should update multiple tasks in the database', async () => {
    const task1 = await localDataSource.addTask(taskFactory.create({ sortOrder: 1 }));
    const task2 = await localDataSource.addTask(taskFactory.create({ sortOrder: 2 }));

    const rev1 = task1._rev;
    const rev2 = task2._rev;

    task1.sortOrder = 3;
    task2.sortOrder = 4;

    const updatedTasks = await localDataSource.updateTasks([task1, task2]);

    expect(updatedTasks).toHaveLength(2);
    expect(updatedTasks[0].sortOrder).toBe(3);
    expect(updatedTasks[1].sortOrder).toBe(4);
    expect(updatedTasks[0]._rev).not.toBe(rev1);
    expect(updatedTasks[1]._rev).not.toBe(rev2);
  });

  test('getTasks should use a high unicode value for the endkey', async () => {
    // @ts-ignore: Accessing protected member for testing purposes
    localDataSource.db = {
      allDocs: jest.fn().mockResolvedValue({
        rows: [],
      }),
    } as unknown as PouchDB.Database<DocumentTypes>;

    await localDataSource.getTasks({});

    // @ts-ignore: Accessing protected member for testing purposes
    expect(localDataSource.db.allDocs).toHaveBeenCalledWith({
      startkey: 'task-',
      endkey: 'task-\ufff0',
      include_docs: true,
    });
  });

  test('getTasks should convert date fields to Date objects', async () => {
    await localDataSource.addTask(
      taskFactory.create({
        dueDate: new Date('2023-01-01T00:00:00Z'),
      })
    );

    const task = (await localDataSource.getTasks({}))[0];

    expect(task.dueDate).toBeInstanceOf(Date);
    expect(task.dueDate!.toISOString()).toBe('2023-01-01T00:00:00.000Z');
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
  });

  test('getTasks should return tasks filtered', async () => {
    const task1 = taskFactory.create({ context: 'context1' });

    await localDataSource.addTask(task1);

    const filterMock = jest.spyOn(localDataSource, 'filterTasksByParams').mockReturnValue([]);

    const tasks = await localDataSource.getTasks({
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
    const task1 = taskFactory.create({ _id: 'task1', context: 'context1', sortOrder: 1 });
    const task2 = taskFactory.create({ _id: 'task2', context: 'context1', sortOrder: 0 });
    const task3 = taskFactory.create({ _id: 'task3', context: 'context1', sortOrder: 2 });

    await localDataSource.addTask(task1);
    await localDataSource.addTask(task2);
    await localDataSource.addTask(task3);

    const tasks = await localDataSource.getTasks({ context: 'context1' });

    expect(tasks).toHaveLength(3);
    expect(tasks[0].sortOrder).toBe(0);
    expect(tasks[1].sortOrder).toBe(1);
    expect(tasks[2].sortOrder).toBe(2);
  });

  test('subscribeToTasks should register a task change subscriber', async () => {
    const subscriber = jest.fn();

    localDataSource.subscribeToTasks({ context: 'context1' }, subscriber);

    // The subscriber should be called with the tasks right away
    await waitFor(() => {
      expect(subscriber).toHaveBeenCalled();
    });
  });

  test('subscribeToTasks should stop callback when unsubscribe is called', async () => {
    const subscriber = jest.fn();
    const subscriber2 = jest.fn();

    const unsubscribe = localDataSource.subscribeToTasks({ context: 'context1' }, subscriber);
    localDataSource.subscribeToTasks({ context: 'context1' }, subscriber2);

    await waitFor(() => {
      // The subscriber should be called with the tasks right away
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    unsubscribe();
    subscriber.mockReset();

    await localDataSource.addTask(taskFactory.create({ context: 'context1' }));

    await waitFor(() => {
      expect(subscriber).not.toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });
  });

  test('addContext should add a context to the database', async () => {
    const contextName = 'test-context';
    await localDataSource.addContext(contextName);

    const contexts = await localDataSource.getContexts();
    expect(contexts).toContain(contextName);
  });

  test('getContexts should return multiple contexts', async () => {
    await database.bulkDocs([
      contextFactory.create({ name: 'context-1' }),
      contextFactory.create({ name: 'context-2' }),
      contextFactory.create({ name: 'context-3' }),
    ]);

    const contexts = await localDataSource.getContexts();
    expect(contexts).toEqual(['context-1', 'context-2', 'context-3']);
  });

  test('getContexts should not filter when includeDeleted is true', async () => {
    const archivedContext = contextFactory.create({
      name: 'deleted-context',
      deletedAt: new Date(),
    });
    const activeContext = contextFactory.create({ name: 'active-context' });

    await database.bulkDocs([archivedContext, activeContext]);

    const contexts = await localDataSource.getContexts(true);
    expect(contexts).toEqual(expect.arrayContaining(['deleted-context', 'active-context']));
  });

  test('getContexts should filter archived contexts when includeDeleted is false', async () => {
    const archivedContext = contextFactory.create({
      name: 'deleted-context',
      deletedAt: new Date(),
    });
    const activeContext = contextFactory.create({ name: 'active-context' });

    await database.bulkDocs([archivedContext, activeContext]);

    const contexts = await localDataSource.getContexts();
    expect(contexts).toEqual(['active-context']);
  });

  describe('runMigrations', () => {
    it('Should not call onMigrationStatusChange if no migrations are needed', async () => {
      const needsMigration = jest.fn().mockResolvedValue(false);
      const onMigrationStatusChange = jest.fn();

      class MockMigrationManager extends MigrationManager {
        needsMigration = needsMigration;
        runMigrations = jest.fn().mockResolvedValue(false);
      }
      const datasource = new LocalDataSource(database, new MockMigrationManager(database));

      datasource.onMigrationStatusChange = onMigrationStatusChange;

      await localDataSource.runMigrations();

      expect(onMigrationStatusChange).not.toHaveBeenCalled();
    });

    it('Should should call onMigrationStatusChange with true when migration starts', async () => {
      const needsMigration = jest.fn().mockResolvedValue(true);
      const onMigrationStatusChange = jest.fn();

      class MockMigrationManager extends MigrationManager {
        needsMigration = needsMigration;
        runMigrations = jest.fn().mockResolvedValue(false);
      }
      const datasource = new LocalDataSource(database, new MockMigrationManager(database));
      datasource.onMigrationStatusChange = onMigrationStatusChange;

      await datasource.runMigrations();

      expect(onMigrationStatusChange).toHaveBeenCalledWith(true);
    });

    it('Should run migrations when needed', async () => {
      const needsMigration = jest.fn().mockResolvedValue(true);
      const runMigrations = jest.fn();

      class MockMigrationManager extends MigrationManager {
        needsMigration = needsMigration;
        runMigrations = runMigrations;
      }
      const datasource = new LocalDataSource(database, new MockMigrationManager(database));

      await datasource.runMigrations();

      expect(runMigrations).toHaveBeenCalled();
    });

    it('Should call onMigrationStatusChange with false when migration completes', async () => {
      const needsMigration = jest.fn().mockResolvedValue(true);
      const onMigrationStatusChange = jest.fn();

      class MockMigrationManager extends MigrationManager {
        needsMigration = needsMigration;
        runMigrations = jest.fn().mockResolvedValue(false);
      }
      const datasource = new LocalDataSource(database, new MockMigrationManager(database));
      datasource.onMigrationStatusChange = onMigrationStatusChange;

      await datasource.runMigrations();

      expect(onMigrationStatusChange).toHaveBeenCalledWith(false);
    });
  });

  describe('subscribeToContexts', () => {
    it('Should register a context change subscriber and call getContexts', async () => {
      const contextName = 'test-context';

      await localDataSource.addContext(contextName);

      const subscriber = jest.fn();

      localDataSource.subscribeToContexts(subscriber);

      await waitFor(() => {
        expect(subscriber).toHaveBeenCalledWith([contextName]);
      });
    });

    it('Should initialize the context changes feed on first subscriber', async () => {
      const subscriber = jest.fn();
      const initializeSpy = jest.spyOn(
        localDataSource,
        'initializeContextChangesFeed' as keyof LocalDataSource
      );

      localDataSource.subscribeToContexts(subscriber);

      expect(initializeSpy).toHaveBeenCalled();

      initializeSpy.mockRestore();
    });

    it('Should not init the context feed if a subscriber is already registered', async () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      const initializeSpy = jest.spyOn(
        localDataSource,
        'initializeContextChangesFeed' as keyof LocalDataSource
      );
      // First subscription should initialize the feed
      localDataSource.subscribeToContexts(subscriber1);
      expect(initializeSpy).toHaveBeenCalled();
      initializeSpy.mockReset();

      // Second subscription should not re-initialize the feed
      localDataSource.subscribeToContexts(subscriber2);
      expect(initializeSpy).not.toHaveBeenCalled();

      initializeSpy.mockRestore();
    });
  });

  it('Should notify subscribers of context changes', async () => {
    const subscriber = jest.fn();

    localDataSource.subscribeToContexts(subscriber);

    await waitFor(() => {
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    await localDataSource.addContext('a new context');

    await waitFor(() => {
      expect(subscriber).toHaveBeenCalledWith(['a new context']);
    });
  });

  test('filterTasksByParams should filter tasks by context and statuses', () => {
    const tasks: Task[] = [
      taskFactory.create({ context: 'context1', status: TaskStatus.Ready }),
      taskFactory.create({ context: 'context1', status: TaskStatus.Started }),
      taskFactory.create({ context: 'context2', status: TaskStatus.Waiting }),
      taskFactory.create({ context: 'context2', status: TaskStatus.Done }),
    ];

    const filteredTasks = localDataSource.filterTasksByParams(tasks, {
      context: 'context1',
      statuses: [TaskStatus.Started, TaskStatus.Waiting],
    });

    expect(filteredTasks).toHaveLength(1);
    expect(filteredTasks[0].status).toBe(TaskStatus.Started);
  });

  test('filterTasksByParams should filter by multiple statuses', () => {
    const tasks: Task[] = [
      taskFactory.create({ status: TaskStatus.Ready }),
      taskFactory.create({ status: TaskStatus.Started }),
      taskFactory.create({ status: TaskStatus.Waiting }),
      taskFactory.create({ status: TaskStatus.Done }),
    ];

    const filteredTasks = localDataSource.filterTasksByParams(tasks, {
      statuses: [TaskStatus.Ready, TaskStatus.Started],
    });

    expect(filteredTasks).toHaveLength(2);
    expect(filteredTasks[0].status).toBe(TaskStatus.Ready);
    expect(filteredTasks[1].status).toBe(TaskStatus.Started);
  });
});
