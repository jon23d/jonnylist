import { waitFor } from '@testing-library/dom';
import { DataSource } from '@/data/DataSource';
import { Preferences } from '@/data/documentTypes/Preferences';
import { generateKeyBetween, generateNKeysBetween } from '@/helpers/fractionalIndexing';
import { createTestDataSource, setupTestDatabase } from '@/test-utils/db';
import { ContextFactory } from '@/test-utils/factories/ContextFactory';
import { LocalSettingsFactory } from '@/test-utils/factories/LocalSettingsFactory';
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

describe('DataSource', () => {
  const { getDataSource, getDb } = setupTestDatabase();
  const contextFactory = new ContextFactory();
  const taskFactory = new TaskFactory();
  const localSettingsFactory = new LocalSettingsFactory();
  const preferencesFactory = new PreferencesFactory();

  it('should initialize with an empty database', async () => {
    const dataSource = getDataSource();
    const contexts = await dataSource.getContexts();
    expect(contexts).toEqual([]);
  });

  describe('initializeSync', () => {
    it('Should only create a sync db if sync settings are present', async () => {
      const dataSource = getDataSource();

      const newDb = jest.spyOn(dataSource, 'createSyncDb');

      await dataSource.initializeSync();

      expect(newDb).not.toHaveBeenCalled();
    });

    it('Creates a sync db if sync settings are present', async () => {
      // this is a little more complicated than normal because we need to deal with creating a sync db
      const dataSource = getDataSource();
      await dataSource.setLocalSettings(
        new LocalSettingsFactory().create({
          syncServerUrl: 'https://local.local/db',
          syncServerAccessToken: 'a token',
        })
      );

      // This is the sync db that will be created
      const { database: syncDb } = createTestDataSource();
      const createSyncDbSpy = jest.spyOn(dataSource, 'createSyncDb').mockReturnValue(syncDb);

      await dataSource.initializeSync();

      expect(createSyncDbSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          syncServerUrl: 'https://local.local/db',
          syncServerAccessToken: 'a token',
        })
      );

      dataSource.cancelSync();
      syncDb.destroy();
    });

    it('Syncs the database with the sync server', async () => {
      // this is a little more complicated than normal because we need to deal with creating a sync db
      const dataSource = getDataSource();
      await dataSource.setLocalSettings(
        new LocalSettingsFactory().create({
          syncServerUrl: 'https://local.local/db',
          syncServerAccessToken: 'a token',
        })
      );

      // This is the sync db that will be created
      const { database: syncDb } = createTestDataSource();
      jest.spyOn(dataSource, 'createSyncDb').mockReturnValue(syncDb);

      await dataSource.initializeSync();

      const newTask = new TaskFactory().create();
      await dataSource.addTask(newTask);

      await waitFor(async () => {
        const tasks = await syncDb.allDocs<Task>({
          include_docs: true,
          startkey: 'task-',
          endkey: 'task-\ufff0',
        });
        expect(tasks.rows).toHaveLength(1);
      });

      dataSource.cancelSync();
      syncDb.destroy();
    });
  });

  test('getPreferences should return default preferences', async () => {
    const dataSource = getDataSource();
    const preferences = await dataSource.getPreferences();
    expect(preferences).toEqual({
      lastSelectedContext: 'context1',
    });
  });

  test('getPreferences should return stored preferences', async () => {
    const database = getDb();
    const dataSource = getDataSource();
    await database.post<Preferences>(
      new PreferencesFactory().create({
        lastSelectedContext: 'context1',
      })
    );

    const preferences = await dataSource.getPreferences();
    expect(preferences.lastSelectedContext).toBe('context1');
  });

  test('setPreferences should create new preferences in the database', async () => {
    const dataSource = getDataSource();
    const newPreferences = new PreferencesFactory().create({
      lastSelectedContext: 'foo-context',
    });

    await dataSource.setPreferences(newPreferences);

    const preferences = await dataSource.getPreferences();
    expect(preferences.lastSelectedContext).toBe('foo-context');
  });

  test('setPreferences should update existing preferences', async () => {
    const dataSource = getDataSource();
    const newPreferences = new PreferencesFactory().create({
      lastSelectedContext: 'foo-context',
    });

    await dataSource.setPreferences(newPreferences);

    const preferences = await dataSource.getPreferences();
    expect(preferences.lastSelectedContext).toBe('foo-context');

    preferences.lastSelectedContext = 'poo-context';
    await dataSource.setPreferences(preferences);

    const updatedPreferences = await dataSource.getPreferences();
    expect(updatedPreferences.lastSelectedContext).toBe('poo-context');
  });

  test('addTask should add a task to the database', async () => {
    const dataSource = getDataSource();
    const database = getDb();
    const task = taskFactory.create({
      sortOrder: 'a',
    });

    await dataSource.addTask(task);

    const tasks = await database.allDocs({ include_docs: true });
    expect(tasks.rows).toHaveLength(1);

    const returnedTask = tasks.rows[0].doc as Task;

    const expectedSort = generateKeyBetween(null, null);

    expect(returnedTask.context).toEqual(task.context);
    expect(returnedTask._id.startsWith('task-')).toBe(true);
    expect(returnedTask.sortOrder).toBe(expectedSort);
  });

  test('addTask should append the _rev to the task', async () => {
    const dataSource = getDataSource();
    const task = taskFactory.create({
      context: 'context1',
    });

    const addedTask = await dataSource.addTask(task);

    expect(addedTask._rev).toBeDefined();
    expect(addedTask._id.startsWith('task-')).toBe(true);

    const tasks = await dataSource.getTasks({ context: 'context1' });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]._rev).toBe(addedTask._rev);
  });

  test('updateTask should update an existing task in the database', async () => {
    const dataSource = getDataSource();
    const newTask = taskFactory.create({
      context: 'context1',
      sortOrder: 'a',
    });

    const task = await dataSource.addTask(newTask);
    const timeAfterUpdate = new Date();

    const updatedTask = await dataSource.updateTask({ ...task, sortOrder: 'z' });

    expect(updatedTask.sortOrder).toBe('z');

    const tasks = await dataSource.getTasks({ context: 'context1' });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].sortOrder).toBe('z');
    expect(tasks[0].updatedAt.getTime()).toBeGreaterThanOrEqual(timeAfterUpdate.getTime());
  });

  test('updateTasks should update multiple tasks in the database', async () => {
    const dataSource = getDataSource();
    const task1 = await dataSource.addTask(taskFactory.create({ sortOrder: 'a' }));
    const task2 = await dataSource.addTask(taskFactory.create({ sortOrder: 'g' }));

    const rev1 = task1._rev;
    const rev2 = task2._rev;

    task1.sortOrder = 'b';
    task2.sortOrder = 'h';

    const updatedTasks = await dataSource.updateTasks([task1, task2]);

    expect(updatedTasks).toHaveLength(2);
    expect(updatedTasks[0].sortOrder).toBe('b');
    expect(updatedTasks[1].sortOrder).toBe('h');
    expect(updatedTasks[0]._rev).not.toBe(rev1);
    expect(updatedTasks[1]._rev).not.toBe(rev2);
  });

  test('getTasks should use a high unicode value for the endkey', async () => {
    const dataSource = getDataSource();
    // @ts-ignore: Accessing protected member for testing purposes
    dataSource.db = {
      allDocs: jest.fn().mockResolvedValue({
        rows: [],
      }),
    } as unknown as PouchDB.Database<DocumentTypes>;

    await dataSource.getTasks({});

    // @ts-ignore: Accessing protected member for testing purposes
    expect(dataSource.db.allDocs).toHaveBeenCalledWith({
      startkey: 'task-',
      endkey: 'task-\ufff0',
      include_docs: true,
    });
  });

  test('getTasks should return tasks filtered', async () => {
    const dataSource = getDataSource();
    const task1 = taskFactory.create({ context: 'context1' });

    await dataSource.addTask(task1);

    const filterMock = jest.spyOn(dataSource, 'filterTasksByParams').mockReturnValue([]);

    const tasks = await dataSource.getTasks({
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
    const dataSource = getDataSource();
    const sorts = generateNKeysBetween(null, null, 3);
    // out of order tasks
    const task1 = taskFactory.create({ _id: 'task1', context: 'context1', sortOrder: sorts[1] });
    const task2 = taskFactory.create({ _id: 'task2', context: 'context1', sortOrder: sorts[0] });
    const task3 = taskFactory.create({ _id: 'task3', context: 'context1', sortOrder: sorts[2] });

    await dataSource.addTask(task1);
    await dataSource.addTask(task2);
    await dataSource.addTask(task3);

    const tasks = await dataSource.getTasks({ context: 'context1' });

    expect(tasks).toHaveLength(3);
    expect(tasks[0].sortOrder).toBe(sorts[0]); // task 2
    expect(tasks[1].sortOrder).toBe(sorts[1]); // task 1
    expect(tasks[2].sortOrder).toBe(sorts[2]); // task 3
  });

  test('subscribeToTasks should register a task change subscriber', async () => {
    const dataSource = getDataSource();
    const subscriber = jest.fn();

    dataSource.subscribeToTasks({ context: 'context1' }, subscriber);

    // The subscriber should be called with the tasks right away
    await waitFor(() => {
      expect(subscriber).toHaveBeenCalled();
    });
  });

  test('subscribeToTasks should stop callback when unsubscribe is called', async () => {
    const dataSource = getDataSource();
    const subscriber = jest.fn();
    const subscriber2 = jest.fn();

    const unsubscribe = dataSource.subscribeToTasks({ context: 'context1' }, subscriber);
    dataSource.subscribeToTasks({ context: 'context1' }, subscriber2);

    await waitFor(() => {
      // The subscriber should be called with the tasks right away
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    unsubscribe();
    subscriber.mockReset();

    await dataSource.addTask(taskFactory.create({ context: 'context1' }));

    await waitFor(() => {
      expect(subscriber).not.toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });
  });

  test('addContext should add a context to the database', async () => {
    const dataSource = getDataSource();
    const contextName = 'test-context';
    await dataSource.addContext(contextName);

    const contexts = await dataSource.getContexts();
    expect(contexts).toContain(contextName);
  });

  test('getContexts should return multiple contexts', async () => {
    const dataSource = getDataSource();
    const database = getDb();

    await database.bulkDocs([
      contextFactory.create({ name: 'context-1' }),
      contextFactory.create({ name: 'context-2' }),
      contextFactory.create({ name: 'context-3' }),
    ]);

    const contexts = await dataSource.getContexts();
    expect(contexts).toEqual(['context-1', 'context-2', 'context-3']);
  });

  test('getContexts should not filter when includeDeleted is true', async () => {
    const dataSource = getDataSource();
    const database = getDb();

    const archivedContext = contextFactory.create({
      name: 'deleted-context',
      deletedAt: new Date(),
    });
    const activeContext = contextFactory.create({ name: 'active-context' });

    await database.bulkDocs([archivedContext, activeContext]);

    const contexts = await dataSource.getContexts(true);
    expect(contexts).toEqual(expect.arrayContaining(['deleted-context', 'active-context']));
  });

  test('getContexts should filter archived contexts when includeDeleted is false', async () => {
    const dataSource = getDataSource();
    const database = getDb();

    const archivedContext = contextFactory.create({
      name: 'deleted-context',
      deletedAt: new Date(),
    });
    const activeContext = contextFactory.create({ name: 'active-context' });

    await database.bulkDocs([archivedContext, activeContext]);

    const contexts = await dataSource.getContexts();
    expect(contexts).toEqual(['active-context']);
  });

  describe('runMigrations', () => {
    it('Should not call onMigrationStatusChange if no migrations are needed', async () => {
      const dataSource = getDataSource();
      const database = getDb();

      const needsMigration = jest.fn().mockResolvedValue(false);
      const onMigrationStatusChange = jest.fn();

      class MockMigrationManager extends MigrationManager {
        needsMigration = needsMigration;
        runMigrations = jest.fn().mockResolvedValue(false);
      }
      const datasource = new DataSource(database, new MockMigrationManager(database));

      datasource.onMigrationStatusChange = onMigrationStatusChange;

      await dataSource.runMigrations();

      expect(onMigrationStatusChange).not.toHaveBeenCalled();
    });

    it('Should should call onMigrationStatusChange with true when migration starts', async () => {
      const database = getDb();

      const needsMigration = jest.fn().mockResolvedValue(true);
      const onMigrationStatusChange = jest.fn();

      class MockMigrationManager extends MigrationManager {
        needsMigration = needsMigration;
        runMigrations = jest.fn().mockResolvedValue(false);
      }
      const datasource = new DataSource(database, new MockMigrationManager(database));
      datasource.onMigrationStatusChange = onMigrationStatusChange;

      await datasource.runMigrations();

      expect(onMigrationStatusChange).toHaveBeenCalledWith(true);
    });

    it('Should run migrations when needed', async () => {
      const database = getDb();

      const needsMigration = jest.fn().mockResolvedValue(true);
      const runMigrations = jest.fn();

      class MockMigrationManager extends MigrationManager {
        needsMigration = needsMigration;
        runMigrations = runMigrations;
      }
      const datasource = new DataSource(database, new MockMigrationManager(database));

      await datasource.runMigrations();

      expect(runMigrations).toHaveBeenCalled();
    });

    it('Should call onMigrationStatusChange with false when migration completes', async () => {
      const database = getDb();

      const needsMigration = jest.fn().mockResolvedValue(true);
      const onMigrationStatusChange = jest.fn();

      class MockMigrationManager extends MigrationManager {
        needsMigration = needsMigration;
        runMigrations = jest.fn().mockResolvedValue(false);
      }
      const datasource = new DataSource(database, new MockMigrationManager(database));
      datasource.onMigrationStatusChange = onMigrationStatusChange;

      await datasource.runMigrations();

      expect(onMigrationStatusChange).toHaveBeenCalledWith(false);
    });
  });

  describe('subscribeToContexts', () => {
    const { getDataSource } = setupTestDatabase();

    it('Should register a context change subscriber and call getContexts', async () => {
      const dataSource = getDataSource();
      const contextName = 'test-context';

      await dataSource.addContext(contextName);

      const subscriber = jest.fn();

      dataSource.subscribeToContexts(subscriber);

      await waitFor(() => {
        expect(subscriber).toHaveBeenCalledWith([contextName]);
      });
    });

    it('Should initialize the context changes feed on first subscriber', async () => {
      const dataSource = getDataSource();

      const subscriber = jest.fn();
      const initializeSpy = jest.spyOn(
        dataSource,
        'initializeContextChangesFeed' as keyof DataSource
      );

      dataSource.subscribeToContexts(subscriber);

      expect(initializeSpy).toHaveBeenCalled();

      initializeSpy.mockRestore();
    });

    it('Should not init the context feed if a subscriber is already registered', async () => {
      const dataSource = getDataSource();

      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      const initializeSpy = jest.spyOn(
        dataSource,
        'initializeContextChangesFeed' as keyof DataSource
      );
      // First subscription should initialize the feed
      dataSource.subscribeToContexts(subscriber1);
      expect(initializeSpy).toHaveBeenCalled();
      initializeSpy.mockReset();

      // Second subscription should not re-initialize the feed
      dataSource.subscribeToContexts(subscriber2);
      expect(initializeSpy).not.toHaveBeenCalled();

      initializeSpy.mockRestore();
    });
  });

  it('Should notify subscribers of context changes', async () => {
    const dataSource = getDataSource();
    const subscriber = jest.fn();

    dataSource.subscribeToContexts(subscriber);

    await waitFor(() => {
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    await dataSource.addContext('a new context');

    await waitFor(() => {
      expect(subscriber).toHaveBeenCalledWith(['a new context']);
    });
  });

  describe('filterTasksByParams', () => {
    it('Should filter tasks by context and statuses', () => {
      const dataSource = getDataSource();

      const tasks: Task[] = [
        taskFactory.create({ context: 'context1', status: TaskStatus.Ready }),
        taskFactory.create({ context: 'context1', status: TaskStatus.Started }),
        taskFactory.create({ context: 'context2', status: TaskStatus.Waiting }),
        taskFactory.create({ context: 'context2', status: TaskStatus.Done }),
      ];

      const filteredTasks = dataSource.filterTasksByParams(tasks, {
        context: 'context1',
        statuses: [TaskStatus.Started, TaskStatus.Waiting],
      });

      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].status).toBe(TaskStatus.Started);
    });

    it('Should should filter by multiple statuses', () => {
      const dataSource = getDataSource();

      const tasks: Task[] = [
        taskFactory.create({ status: TaskStatus.Ready }),
        taskFactory.create({ status: TaskStatus.Started }),
        taskFactory.create({ status: TaskStatus.Waiting }),
        taskFactory.create({ status: TaskStatus.Done }),
      ];

      const filteredTasks = dataSource.filterTasksByParams(tasks, {
        statuses: [TaskStatus.Ready, TaskStatus.Started],
      });

      expect(filteredTasks).toHaveLength(2);
      expect(filteredTasks[0].status).toBe(TaskStatus.Ready);
      expect(filteredTasks[1].status).toBe(TaskStatus.Started);
    });

    it('Should should filter by a single status', () => {
      const dataSource = getDataSource();

      const filteredTasks = dataSource.filterTasksByParams(
        [taskFactory.create({ status: TaskStatus.Started })],
        { statuses: [TaskStatus.Started] }
      );

      expect(filteredTasks).toHaveLength(1);
    });

    it('Should return all tasks if no filters are applied', () => {
      const dataSource = getDataSource();

      const tasks: Task[] = [
        taskFactory.create({ status: TaskStatus.Ready }),
        taskFactory.create({ status: TaskStatus.Started }),
        taskFactory.create({ status: TaskStatus.Waiting }),
        taskFactory.create({ status: TaskStatus.Done }),
      ];

      const filteredTasks = dataSource.filterTasksByParams(tasks, {});

      expect(filteredTasks).toHaveLength(4);
    });
  });

  describe('archiveContext', () => {
    it('Moves tasks with status of ready, waiting, and started to a new context', async () => {
      const dataSource = getDataSource();

      await Promise.all([
        dataSource.addContext('old-context'),
        dataSource.addContext('new-context'),
        dataSource.addTask(
          taskFactory.create({ status: TaskStatus.Ready, context: 'old-context' })
        ),
        dataSource.addTask(
          taskFactory.create({ status: TaskStatus.Waiting, context: 'old-context' })
        ),
        dataSource.addTask(
          taskFactory.create({ status: TaskStatus.Started, context: 'old-context' })
        ),
        dataSource.addTask(taskFactory.create({ status: TaskStatus.Done, context: 'old-context' })),
        dataSource.addTask(
          taskFactory.create({ status: TaskStatus.Cancelled, context: 'old-context' })
        ),
      ]);

      await dataSource.archiveContext('old-context', 'new-context');

      const newContextTasks = await dataSource.getTasks({
        context: 'new-context',
      });
      const oldContextTasks = await dataSource.getTasks({
        context: 'old-context',
      });

      expect(newContextTasks.map((t) => t.status)).toEqual(
        expect.arrayContaining([TaskStatus.Ready, TaskStatus.Waiting, TaskStatus.Started])
      );
      expect(oldContextTasks.map((t) => t.status)).toEqual(
        expect.arrayContaining([TaskStatus.Done, TaskStatus.Cancelled])
      );
    });

    it('Archives the source context', async () => {
      const dataSource = getDataSource();

      await dataSource.addContext('old-context');
      await dataSource.addContext('new-context');

      await dataSource.archiveContext('old-context', 'new-context');

      const contexts = await dataSource.getContexts();
      expect(contexts).toEqual(['new-context']);
    });
  });

  describe('exportAllData', () => {
    it('should export all documents from the database, except for _local', async () => {
      const dataSource = getDataSource();
      await Promise.all([
        dataSource.addContext('a-context'),
        dataSource.setLocalSettings(localSettingsFactory.create()),
        dataSource.setPreferences(preferencesFactory.create()),
        dataSource.addTask(taskFactory.create({ context: 'a-context' })),
      ]);

      const exportedData = await dataSource.exportAllData();

      const exportedContext = exportedData.find((doc) => doc._id === 'context-a-context');
      const exportedLocalSettings = exportedData.find((doc) => doc._id === 'local-settings');
      const exportedPreferences = exportedData.find((doc) => doc._id === 'preferences');
      const exportedTask = exportedData.find((doc) => doc._id.startsWith('task-'));

      expect(exportedContext).toBeDefined();
      expect(exportedLocalSettings).not.toBeDefined();
      expect(exportedPreferences).toBeDefined();
      expect(exportedTask).toBeDefined();
    });
  });

  describe('importData', () => {
    it('should import data into the database', async () => {
      const dataSource = getDataSource();
      const context = contextFactory.create({ name: 'imported-context', _rev: 'abc-123' });
      const task = taskFactory.create({ context: 'imported-context' });
      const localSettings = localSettingsFactory.create({
        syncServerUrl: 'https://imported.local/db',
        syncServerAccessToken: 'foof',
      });

      const importedData = [context, task, localSettings];

      await dataSource.importData(importedData);

      const contexts = await dataSource.getContexts();
      expect(contexts).toContain('imported-context');

      const tasks = await dataSource.getTasks({ context: 'imported-context' });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].context).toBe('imported-context');
      expect(tasks[0]._rev).not.toBe('abc-123'); // this should have been replaced

      const settings = await dataSource.getLocalSettings();
      expect(settings).not.toEqual(expect.objectContaining(localSettings));
    });
  });
});
