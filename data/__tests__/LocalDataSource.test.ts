import PouchDB from 'pouchdb';
import { DocumentTypes } from '@/data/interfaces';
import { LocalDataSource } from '@/data/LocalDataSource';
import { ContextFactory } from '@/test-utils/factories/ContextFactory';

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

  it('Should add a context and retrieve it', async () => {
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
});
