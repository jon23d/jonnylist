import { waitFor } from '@testing-library/dom';
import PouchDB from 'pouchdb';
import { LocalDataSource } from '@/data/LocalDataSource';
import { ContextFactory } from '@/test-utils/factories/ContextFactory';
import { DocumentTypes } from '../documentTypes';

describe('LocalDataSource', () => {
  let localDataSource: LocalDataSource;
  let database: PouchDB.Database<DocumentTypes>;
  const contextFactory = new ContextFactory();

  beforeEach(() => {
    // I could never get the pouchdb-memory plugin to work with the test suite,
    // so we use a new database for each test. If we don't subsequent runs will fail
    database = new PouchDB<DocumentTypes>(
      `test_db_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    );
    localDataSource = new LocalDataSource(database);
  });

  afterEach(async () => {
    await database.destroy();
  });

  it('should initialize with an empty database', async () => {
    const contexts = await localDataSource.getContexts();
    expect(contexts).toEqual([]);
  });

  it('addContext should add a context to the database', async () => {
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
