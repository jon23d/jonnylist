import { waitFor } from '@testing-library/dom';
import { DataSource } from '@/data/DataSource';
import { Preferences } from '@/data/documentTypes/Preferences';
import { generateKeyBetween, generateNKeysBetween } from '@/helpers/fractionalIndexing';
import { createTestDataSource, setupTestDatabase } from '@/test-utils/db';
import { contextFactory } from '@/test-utils/factories/ContextFactory';
import { localSettingsFactory } from '@/test-utils/factories/LocalSettingsFactory';
import { preferencesFactory } from '@/test-utils/factories/PreferencesFactory';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { DocumentTypes } from '../documentTypes';
import { Task, TaskPriority, TaskStatus } from '../documentTypes/Task';
import { MigrationManager } from '../migrations/MigrationManager';

jest.mock('@/data/documentTypes/Preferences', () => ({
  createDefaultPreferences: jest.fn(() => ({
    lastSelectedContext: 'context1',
  })),
}));

describe('DataSource', () => {
  const { getDataSource, getDb } = setupTestDatabase();

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
        localSettingsFactory({
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
        localSettingsFactory({
          syncServerUrl: 'https://local.local/db',
          syncServerAccessToken: 'a token',
        })
      );

      // This is the sync db that will be created
      const { database: syncDb } = createTestDataSource();
      jest.spyOn(dataSource, 'createSyncDb').mockReturnValue(syncDb);

      await dataSource.initializeSync();

      const newTask = taskFactory();
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
      preferencesFactory({
        lastSelectedContext: 'context1',
      })
    );

    const preferences = await dataSource.getPreferences();
    expect(preferences.lastSelectedContext).toBe('context1');
  });

  test('setPreferences should create new preferences in the database', async () => {
    const dataSource = getDataSource();
    const newPreferences = preferencesFactory({
      lastSelectedContext: 'foo-context',
    });

    await dataSource.setPreferences(newPreferences);

    const preferences = await dataSource.getPreferences();
    expect(preferences.lastSelectedContext).toBe('foo-context');
  });

  test('setPreferences should update existing preferences', async () => {
    const dataSource = getDataSource();
    const newPreferences = preferencesFactory({
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

    await dataSource.addTask(taskFactory({ context: 'context1' }));

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
      contextFactory({ name: 'context-1' }),
      contextFactory({ name: 'context-2' }),
      contextFactory({ name: 'context-3' }),
    ]);

    const contexts = await dataSource.getContexts();
    expect(contexts).toEqual(['context-1', 'context-2', 'context-3']);
  });

  test('getContexts should not filter when includeDeleted is true', async () => {
    const dataSource = getDataSource();
    const database = getDb();

    const archivedContext = contextFactory({
      name: 'deleted-context',
      deletedAt: new Date(),
    });
    const activeContext = contextFactory({ name: 'active-context' });

    await database.bulkDocs([archivedContext, activeContext]);

    const contexts = await dataSource.getContexts(true);
    expect(contexts).toEqual(expect.arrayContaining(['deleted-context', 'active-context']));
  });

  test('getContexts should filter archived contexts when includeDeleted is false', async () => {
    const dataSource = getDataSource();
    const database = getDb();

    const archivedContext = contextFactory({
      name: 'deleted-context',
      deletedAt: new Date(),
    });
    const activeContext = contextFactory({ name: 'active-context' });

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

  describe('archiveContext', () => {
    it('Moves tasks with status of ready, waiting, and started to a new context', async () => {
      const dataSource = getDataSource();

      await Promise.all([
        dataSource.addContext('old-context'),
        dataSource.addContext('new-context'),
        dataSource.addTask(taskFactory({ status: TaskStatus.Ready, context: 'old-context' })),
        dataSource.addTask(taskFactory({ status: TaskStatus.Waiting, context: 'old-context' })),
        dataSource.addTask(taskFactory({ status: TaskStatus.Started, context: 'old-context' })),
        dataSource.addTask(taskFactory({ status: TaskStatus.Done, context: 'old-context' })),
        dataSource.addTask(taskFactory({ status: TaskStatus.Cancelled, context: 'old-context' })),
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
        dataSource.setLocalSettings(localSettingsFactory()),
        dataSource.setPreferences(preferencesFactory()),
        dataSource.addTask(taskFactory({ context: 'a-context' })),
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
      const context = contextFactory({ name: 'imported-context', _rev: 'abc-123' });
      const task = taskFactory({ context: 'imported-context' });
      const localSettings = localSettingsFactory({
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
