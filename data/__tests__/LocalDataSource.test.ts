import { waitFor } from '@testing-library/dom';
import { Preferences } from '@/data/documentTypes/Preferences';
import { LocalDataSource } from '@/data/LocalDataSource';
import { createTestLocalDataSource } from '@/test-utils/db';
import { ContextFactory } from '@/test-utils/factories/ContextFactory';
import { PreferencesFactory } from '@/test-utils/factories/PreferencesFactory';
import { TaskFactory } from '@/test-utils/factories/TaskFactory';
import { DocumentTypes } from '../documentTypes';
import { Task } from '../documentTypes/Task';

jest.mock('@/data/documentTypes/Preferences', () => ({
  createDefaultPreferences: jest.fn(() => ({
    lastSelectedContext: 'context1',
  })),
}));

describe('LocalDataSource', () => {
  let localDataSource: LocalDataSource;
  let database: PouchDB.Database<DocumentTypes>;
  const contextFactory = new ContextFactory();

  beforeEach(() => {
    const testData = createTestLocalDataSource();
    localDataSource = testData.dataSource;
    database = testData.database;
  });

  afterEach(async () => {
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
    const task = new TaskFactory().create();

    await localDataSource.addTask(task);

    const tasks = await database.allDocs({ include_docs: true });
    expect(tasks.rows).toHaveLength(1);

    const returnedTask = tasks.rows[0].doc as Task;

    expect(returnedTask.context).toEqual(task.context);
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
});
