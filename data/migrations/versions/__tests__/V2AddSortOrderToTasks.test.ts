import { Task } from '@/data/documentTypes/Task';
import V2AddSortOrderToTasks from '@/data/migrations/versions/V2AddSortOrderToTasks';
import { setupTestDatabase } from '@/test-utils/db';
import { TaskFactory } from '@/test-utils/factories/TaskFactory';

describe('V2AddSortOrderToTasks', () => {
  const { getDb } = setupTestDatabase();
  const taskFactory = new TaskFactory();

  test('needsMigration should return false if version is >= 2', async () => {
    const db = getDb();

    const migration = new V2AddSortOrderToTasks();
    await db.put({
      _id: 'migrations',
      version: 2,
      migrations: [],
    });

    const needsMigration = await migration.needsMigration(db);

    expect(needsMigration).toBe(false);
  });

  test('needsMigration should return true if version is <= 1', async () => {
    const db = getDb();

    const migration = new V2AddSortOrderToTasks();
    await db.put({
      _id: 'migrations',
      version: 1,
      migrations: [],
    });

    const needsMigration = await migration.needsMigration(db);

    expect(needsMigration).toBe(true);
  });

  test('It should add sortOrder to all tasks', async () => {
    const db = getDb();

    const migration = new V2AddSortOrderToTasks();
    await db.put({
      _id: 'migrations',
      version: 1,
      migrations: [],
    });

    // Create some tasks without sortOrder
    const tasks = [
      taskFactory.create({ _id: 'task1', title: 'Task 1' }),
      taskFactory.create({ _id: 'task2', title: 'Task 2' }),
      taskFactory.create({ _id: 'task3', title: 'Task 3' }),
    ];
    await db.bulkDocs(tasks);

    // Run the migration
    await migration.up(db);

    // Fetch the tasks and check if sortOrder is added
    const updatedTasks = await db.allDocs({ include_docs: true, startkey: 'task-' });

    expect(updatedTasks.rows.length).toBe(3);
    updatedTasks.rows.forEach((row, index) => {
      const task = row.doc as Task;
      expect(task.sortOrder).toBeDefined();
      expect(task.sortOrder).toBe(index * 10); // Assuming sortOrder increments by 10
    });
  });

  test('It should update the migrations doc version', async () => {
    const db = getDb();
    const migration = new V2AddSortOrderToTasks();
    await db.put({
      _id: 'migrations',
      version: 1,
      migrations: [],
    });
    await migration.up(db);

    const migrationsDoc: any = await db.get('migrations');
    expect(migrationsDoc.version).toBe(2);
  });
});
