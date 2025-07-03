import { waitFor } from '@testing-library/dom';
import { ContextRepository } from '@/data/ContextRepository';
import { setupTestDatabase } from '@/test-utils/db';
import { contextFactory } from '@/test-utils/factories/ContextFactory';

describe('ContextRepository', () => {
  const { getDb } = setupTestDatabase();

  test('addContext should add a context to the database', async () => {
    const contextRepository = new ContextRepository(getDb());

    const contextName = 'test-context';
    await contextRepository.addContext(contextName);

    const contexts = await contextRepository.getContexts();
    expect(contexts).toContain(contextName);
  });

  test('getContexts should return multiple contexts', async () => {
    const contextRepository = new ContextRepository(getDb());

    await getDb().bulkDocs([
      contextFactory({ name: 'context-1' }),
      contextFactory({ name: 'context-2' }),
      contextFactory({ name: 'context-3' }),
    ]);

    const contexts = await contextRepository.getContexts();
    expect(contexts).toEqual(['context-1', 'context-2', 'context-3']);
  });

  test('getContexts should not filter when includeDeleted is true', async () => {
    const contextRepository = new ContextRepository(getDb());

    const archivedContext = contextFactory({
      name: 'deleted-context',
      deletedAt: new Date(),
    });
    const activeContext = contextFactory({ name: 'active-context' });

    await getDb().bulkDocs([archivedContext, activeContext]);

    const contexts = await contextRepository.getContexts(true);
    expect(contexts).toEqual(expect.arrayContaining(['deleted-context', 'active-context']));
  });

  test('getContexts should filter archived contexts when includeDeleted is false', async () => {
    const contextRepository = new ContextRepository(getDb());

    const archivedContext = contextFactory({
      name: 'deleted-context',
      deletedAt: new Date(),
    });
    const activeContext = contextFactory({ name: 'active-context' });

    await getDb().bulkDocs([archivedContext, activeContext]);

    const contexts = await contextRepository.getContexts();
    expect(contexts).toEqual(['active-context']);
  });

  describe('subscribeToContexts', () => {
    it('Should register a context change subscriber and call getContexts', async () => {
      const contextRepository = new ContextRepository(getDb());

      const contextName = 'test-context';

      await contextRepository.addContext(contextName);

      const subscriber = jest.fn();

      contextRepository.subscribeToContexts(subscriber);

      await waitFor(() => {
        expect(subscriber).toHaveBeenCalledWith([contextName]);
      });
    });

    it('Should initialize the context changes feed on first subscriber', async () => {
      const contextRepository = new ContextRepository(getDb());

      const subscriber = jest.fn();
      const initializeSpy = jest.spyOn(
        contextRepository,
        'initializeContextChangesFeed' as keyof ContextRepository
      );

      contextRepository.subscribeToContexts(subscriber);

      expect(initializeSpy).toHaveBeenCalled();

      initializeSpy.mockRestore();
    });

    it('Should not init the context feed if a subscriber is already registered', async () => {
      const contextRepository = new ContextRepository(getDb());

      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();
      const initializeSpy = jest.spyOn(
        contextRepository,
        'initializeContextChangesFeed' as keyof ContextRepository
      );
      // First subscription should initialize the feed
      contextRepository.subscribeToContexts(subscriber1);
      expect(initializeSpy).toHaveBeenCalled();
      initializeSpy.mockReset();

      // Second subscription should not re-initialize the feed
      contextRepository.subscribeToContexts(subscriber2);
      expect(initializeSpy).not.toHaveBeenCalled();

      initializeSpy.mockRestore();
    });
  });

  it('Should notify subscribers of context changes', async () => {
    const contextRepository = new ContextRepository(getDb());

    const subscriber = jest.fn();

    contextRepository.subscribeToContexts(subscriber);

    await waitFor(() => {
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    await contextRepository.addContext('a new context');

    await waitFor(() => {
      expect(subscriber).toHaveBeenCalledWith(['a new context']);
    });
  });
});
