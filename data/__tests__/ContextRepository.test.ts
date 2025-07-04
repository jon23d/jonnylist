import { waitFor } from '@testing-library/dom';
import { ContextRepository } from '@/data/ContextRepository';
import { setupTestDatabase } from '@/test-utils/db';
import { contextFactory } from '@/test-utils/factories/ContextFactory';

describe('ContextRepository', () => {
  const { getDb } = setupTestDatabase();

  test('addContext should add a context to the database', async () => {
    const contextRepository = new ContextRepository(getDb());

    const context = contextFactory();
    await contextRepository.addContext(context);

    const contexts = await contextRepository.getContexts();
    expect(contexts[0].name).toEqual(context.name);
  });

  test('getContexts should return multiple contexts', async () => {
    const contextRepository = new ContextRepository(getDb());

    await getDb().bulkDocs([
      contextFactory({ name: 'context-1' }),
      contextFactory({ name: 'context-2' }),
      contextFactory({ name: 'context-3' }),
    ]);

    const contexts = await contextRepository.getContexts();
    expect(contexts.map((context) => context.name)).toEqual([
      'context-1',
      'context-2',
      'context-3',
    ]);
  });

  describe('subscribeToContexts', () => {
    it('Should register a context change subscriber and call getContexts', async () => {
      const contextRepository = new ContextRepository(getDb());

      const context = contextFactory();

      await contextRepository.addContext(context);

      const subscriber = jest.fn();

      contextRepository.subscribeToContexts(subscriber);

      await waitFor(() => {
        expect(subscriber).toHaveBeenCalledWith([expect.objectContaining(context)]);
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
    const context = contextFactory();

    const subscriber = jest.fn();

    contextRepository.subscribeToContexts(subscriber);

    await waitFor(() => {
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    await contextRepository.addContext(context);

    await waitFor(() => {
      expect(subscriber).toHaveBeenCalledWith([expect.objectContaining(context)]);
    });
  });
});
