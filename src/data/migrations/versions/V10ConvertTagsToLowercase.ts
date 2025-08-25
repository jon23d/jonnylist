import { MigrationsDoc } from '@/data/documentTypes/MigrationsDoc';
import { Task } from '@/data/documentTypes/Task';
import { Migration } from '../Migration';

class V10ConvertTagsToLowercase implements Migration {
  getVersion(): number {
    return 10;
  }

  async needsMigration(db: PouchDB.Database): Promise<boolean> {
    const migrations = await db.get<MigrationsDoc>('migrations');
    return !(migrations && migrations.version >= this.getVersion());
  }

  async up(db: PouchDB.Database): Promise<void> {
    const result = await db.allDocs<Task>({
      include_docs: true,
      startkey: 'task-',
      endkey: 'task-\ufff0',
    });

    const tasks = result.rows.map((row) => row.doc!);

    // Make each task's tags lowercase
    for (const task of tasks) {
      if (task.tags && task.tags.length > 0) {
        task.tags = task.tags.map((tag) => tag.toLowerCase());
        await db.put(task);
      }
    }

    // Update the migrations document to reflect the new version
    const migrationsDoc = await db.get<MigrationsDoc>('migrations');
    migrationsDoc.version = 10;
    await db.put(migrationsDoc);
  }
}

export default V10ConvertTagsToLowercase;
