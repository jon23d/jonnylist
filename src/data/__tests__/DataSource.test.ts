import { waitFor } from '@testing-library/dom';
import PouchDB from 'pouchdb';
import { DataSource } from '@/data/DataSource';
import { createTestDataSource, setupTestDatabase } from '@/test-utils/db';
import { localSettingsFactory } from '@/test-utils/factories/LocalSettingsFactory';
import { preferencesFactory } from '@/test-utils/factories/PreferencesFactory';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { Task } from '../documentTypes/Task';
import { MigrationManager } from '../migrations/MigrationManager';

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

      const newDb = vi.spyOn(dataSource, 'createSyncDb');

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
      const createSyncDbSpy = vi.spyOn(dataSource, 'createSyncDb').mockReturnValue(syncDb);

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
      vi.spyOn(dataSource, 'createSyncDb').mockReturnValue(syncDb);

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

  describe('runMigrations', () => {
    it('Should not call onMigrationStatusChange if no migrations are needed', async () => {
      const dataSource = getDataSource();
      const database = getDb();

      const needsMigration = vi.fn().mockResolvedValue(false);
      const onMigrationStatusChange = vi.fn();

      class MockMigrationManager extends MigrationManager {
        needsMigration = needsMigration;
        runMigrations = vi.fn().mockResolvedValue(false);
      }
      const datasource = new DataSource(database, new MockMigrationManager(database));

      datasource.onMigrationStatusChange = onMigrationStatusChange;

      await dataSource.runMigrations();

      expect(onMigrationStatusChange).not.toHaveBeenCalled();
    });

    it('Should should call onMigrationStatusChange with true when migration starts', async () => {
      const database = getDb();

      const needsMigration = vi.fn().mockResolvedValue(true);
      const onMigrationStatusChange = vi.fn();

      class MockMigrationManager extends MigrationManager {
        needsMigration = needsMigration;
        runMigrations = vi.fn().mockResolvedValue(false);
      }
      const datasource = new DataSource(database, new MockMigrationManager(database));
      datasource.onMigrationStatusChange = onMigrationStatusChange;

      await datasource.runMigrations();

      expect(onMigrationStatusChange).toHaveBeenCalledWith(true);
    });

    it('Should run migrations when needed', async () => {
      const database = getDb();

      const needsMigration = vi.fn().mockResolvedValue(true);
      const runMigrations = vi.fn();

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

      const needsMigration = vi.fn().mockResolvedValue(true);
      const onMigrationStatusChange = vi.fn();

      class MockMigrationManager extends MigrationManager {
        needsMigration = needsMigration;
        runMigrations = vi.fn().mockResolvedValue(false);
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
      const preferencesRepository = dataSource.getPreferencesRepository();

      await Promise.all([
        dataSource.setLocalSettings(localSettingsFactory()),
        preferencesRepository.setPreferences(preferencesFactory()),
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

  test('getDatabase returns the implicitly-created database instance', () => {
    const dataSource = getDataSource();
    const db = dataSource.getDatabase();
    expect(db).toBeInstanceOf(PouchDB);
  });
});
