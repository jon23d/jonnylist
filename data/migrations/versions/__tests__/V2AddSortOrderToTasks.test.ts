import { DataSource } from '@/data/DataSource';
import { Task } from '@/data/documentTypes/Task';
import V2AddSortOrderToTasks from '@/data/migrations/versions/V2AddSortOrderToTasks';
import { createTestLocalDataSource } from '@/test-utils/db';

describe('V2AddSortOrderToTasks', () => {
  let dataSource: DataSource;
  let db: PouchDB.Database;

  beforeEach(() => {
    jest.clearAllMocks();

    const testData = createTestLocalDataSource();
    dataSource = testData.dataSource;
    db = testData.database;
  });

  afterEach(async () => {
    await dataSource.cleanup();
    await db.destroy();
  });

  test('needsMigration should return false if version is >= 2', async () => {
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
    const migration = new V2AddSortOrderToTasks();
    await db.put({
      _id: 'migrations',
      version: 1,
      migrations: [],
    });

    // Create some tasks without sortOrder
    const tasks = [
      { _id: 'task1', title: 'Task 1' },
      { _id: 'task2', title: 'Task 2' },
      { _id: 'task3', title: 'Task 3' },
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
