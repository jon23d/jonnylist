import { DataSource } from '@/data/DataSource';
import { DocumentTypes } from '@/data/documentTypes';
import { TaskStatus } from '@/data/documentTypes/Task';
import { TaskMover } from '@/helpers/TaskMover';
import { createTestLocalDataSource } from '@/test-utils/db';
import { TaskFactory } from '@/test-utils/factories/TaskFactory';

describe('TaskMover', () => {
  let db: PouchDB.Database<DocumentTypes>;
  let dataSource: DataSource;
  const taskFactory = new TaskFactory();

  beforeEach(() => {
    jest.clearAllMocks();

    const testData = createTestLocalDataSource();
    db = testData.database;
    dataSource = testData.dataSource;
  });

  afterEach(async () => {
    await dataSource.cleanup();
    await db.destroy();
  });

  describe('moveIncompleteTasksToNewContext', () => {
    it('Moves tasks with status of ready, waiting, and started to a new context', async () => {
      await Promise.all([
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

      const taskMover = new TaskMover(dataSource);

      await taskMover.moveIncompleteTasksToNewContext('old-context', 'new-context');

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

    it('Does not move tasks with status of done or cancelled', async () => {});
  });
});
