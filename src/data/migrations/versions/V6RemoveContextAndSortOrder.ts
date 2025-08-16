import { Context } from '@/data/documentTypes/Context';
import { MigrationsDoc } from '@/data/documentTypes/MigrationsDoc';
import { Task } from '@/data/documentTypes/Task';
import { Migration } from '../Migration';

class V6RemoveContextAndSortOrder implements Migration {
  getVersion(): number {
    return 6;
  }

  async needsMigration(db: PouchDB.Database): Promise<boolean> {
    const migrations = await db.get<MigrationsDoc>('migrations');
    return !(migrations && migrations.version >= this.getVersion());
  }

  async up(db: PouchDB.Database): Promise<void> {
    const tasks = await db.allDocs<Task>({
      include_docs: true,
      startkey: 'task-',
      endkey: 'task-\ufff0',
    });

    const updatedTasks = tasks.rows.map((row) => {
      const oldTask = row.doc;
      // @ts-ignore
      const { sortOrder, context, ...task } = oldTask;

      const newTask: Task = {
        ...task,
      };
      return newTask;
    });

    await db.bulkDocs(updatedTasks);

    // Now delete the contexts
    const contexts = await db.allDocs<Context>({
      include_docs: true,
      startkey: 'context-',
      endkey: 'context-\ufff0',
    });

    const updatedContexts = contexts.rows.map((row) => {
      const context: Context = row.doc!;
      const updated: Context & { _deleted: boolean } = {
        ...context,
        _deleted: true,
      };
      return updated;
    });
    await db.bulkDocs(updatedContexts);

    // Update the migrations document to reflect the new version
    const migrationsDoc = await db.get<MigrationsDoc>('migrations');
    migrationsDoc.version = 6;
    await db.put(migrationsDoc);
  }
}

export default V6RemoveContextAndSortOrder;
