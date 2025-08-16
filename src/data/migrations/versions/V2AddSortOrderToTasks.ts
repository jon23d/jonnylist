import { MigrationsDoc } from '@/data/documentTypes/MigrationsDoc';
import { Task } from '@/data/documentTypes/Task';
import { Migration } from '../Migration';

class V2AddSortOrderToTasks implements Migration {
  getVersion(): number {
    return 2;
  }

  async needsMigration(db: PouchDB.Database): Promise<boolean> {
    const migrations = await db.get<MigrationsDoc>('migrations');
    return !(migrations && migrations.version >= this.getVersion());
  }

  async up(db: PouchDB.Database): Promise<void> {
    // Grab every task and add a sortOrder field, initializing to a value
    // that increases by 10 with each task.
    const tasks = await db.allDocs<Task>({
      include_docs: true,
      startkey: 'task-',
    });

    const updatedTasks = tasks.rows.map((row, index) => {
      const task = row.doc as Task;
      // @ts-ignore   This is because the sortOrder field does not exist yet, and is not yet a string
      task.sortOrder = index * 10; // Increment sortOrder by 10 for each task
      return task;
    });

    // Update the tasks in bulk
    await db.bulkDocs(updatedTasks);

    // Update the migrations document to reflect the new version
    const migrationsDoc = await db.get<MigrationsDoc>('migrations');
    migrationsDoc.version = 2;
    await db.put(migrationsDoc);
  }
}

export default V2AddSortOrderToTasks;
