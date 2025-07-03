import { waitFor } from '@testing-library/dom';
import { DataSource } from '@/data/DataSource';
import { Preferences } from '@/data/documentTypes/Preferences';
import { createTestDataSource, setupTestDatabase } from '@/test-utils/db';
import { localSettingsFactory } from '@/test-utils/factories/LocalSettingsFactory';
import { preferencesFactory } from '@/test-utils/factories/PreferencesFactory';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { Task } from '../documentTypes/Task';
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
    const taskRepository = dataSource.getTaskRepository();

    const tasks = await taskRepository.getTasks({});
    expect(tasks).toEqual([]);
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
      const taskRepository = dataSource.getTaskRepository();

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
      await taskRepository.addTask(newTask);

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

  describe('exportAllData', () => {
    it('should export all documents from the database, except for _local', async () => {
      const dataSource = getDataSource();
      const taskRepository = dataSource.getTaskRepository();

      await Promise.all([
        dataSource.setLocalSettings(localSettingsFactory()),
        dataSource.setPreferences(preferencesFactory()),
        taskRepository.addTask(taskFactory({})),
      ]);

      const exportedData = await dataSource.exportAllData();

      const exportedLocalSettings = exportedData.find((doc) => doc._id === 'local-settings');
      const exportedPreferences = exportedData.find((doc) => doc._id === 'preferences');
      const exportedTask = exportedData.find((doc) => doc._id.startsWith('task-'));

      expect(exportedLocalSettings).not.toBeDefined();
      expect(exportedPreferences).toBeDefined();
      expect(exportedTask).toBeDefined();
    });
  });

  describe('importData', () => {
    it('should import data into the database', async () => {
      const dataSource = getDataSource();
      const taskRepository = dataSource.getTaskRepository();
      const task = taskFactory();
      const localSettings = localSettingsFactory({
        syncServerUrl: 'https://imported.local/db',
        syncServerAccessToken: 'foof',
      });

      const importedData = [task, localSettings];

      await dataSource.importData(importedData);

      const tasks = await taskRepository.getTasks({});
      expect(tasks).toHaveLength(1);
      expect(tasks[0]._rev).not.toBe('abc-123'); // this should have been replaced

      const settings = await dataSource.getLocalSettings();
      expect(settings).not.toEqual(expect.objectContaining(localSettings));
    });
  });
});
