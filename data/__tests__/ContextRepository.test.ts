import { waitFor } from '@testing-library/dom';
import { ContextRepository } from '@/data/ContextRepository';
import { TaskPriority } from '@/data/documentTypes/Task';
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

  it('Should update a context', async () => {
    const contextRepository = new ContextRepository(getDb());
    const context = await contextRepository.addContext(
      contextFactory({
        name: 'Old Name',
        filter: {
          requirePriority: [TaskPriority.High],
        },
      })
    );

    const updatedContext = {
      ...context,
      filter: {
        requireTags: ['urgent'],
      },
      name: 'New Name',
    };
    await contextRepository.updateContext(updatedContext);

    const contexts = await contextRepository.getContexts();
    expect(contexts[0].name).toEqual('New Name');
    expect(contexts[0].filter.requirePriority).toBeUndefined();
    expect(contexts[0].filter.requireTags).toEqual(['urgent']);
  });

  it('Should delete a context', async () => {
    const contextRepository = new ContextRepository(getDb());
    const context = await contextRepository.addContext(contextFactory());

    await contextRepository.deleteContext(context);

    const contexts = await contextRepository.getContexts();
    expect(contexts).toHaveLength(0);
  });

  it('Should get a context by ID', async () => {
    const contextRepository = new ContextRepository(getDb());
    const context = await contextRepository.addContext(contextFactory());

    const fetchedContext = await contextRepository.getContext(context._id);
    expect(fetchedContext).toEqual(expect.objectContaining(context));
  });

  it('Should throw an error if trying to get a context that does not exist', async () => {
    const contextRepository = new ContextRepository(getDb());

    await expect(contextRepository.getContext('non-existent-id')).rejects.toThrow('missing');
  });

  it('getContext should return an error if the document is not a context', async () => {
    const contextRepository = new ContextRepository(getDb());
    const nonContextDoc = {
      _id: 'non-context-id',
      type: 'task',
      name: 'Not a context',
    };

    // @ts-ignore
    getDb().put(nonContextDoc);

    await expect(contextRepository.getContext(nonContextDoc._id)).rejects.toThrow(
      `Document with ID ${nonContextDoc._id} is not a context.`
    );
  });
});
