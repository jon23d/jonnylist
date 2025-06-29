import { generateNKeysBetween } from 'fractional-indexing';
import { MigrationsDoc } from '@/data/documentTypes/MigrationsDoc';
import { Task } from '@/data/documentTypes/Task';
import { Migration } from '../Migration';

class V4UpdateSortsToFractionalString implements Migration {
  getVersion(): number {
    return 4;
  }

  async needsMigration(db: PouchDB.Database): Promise<boolean> {
    const migrations = await db.get<MigrationsDoc>('migrations');
    return !(migrations && migrations.version >= this.getVersion());
  }

  async up(db: PouchDB.Database): Promise<void> {
    const results = await db.allDocs<Task>({
      include_docs: true,
      startkey: 'task-',
      endkey: 'task-\ufff0',
    });
    const tasks = results.rows.map((row) => row.doc);

    // Sort them by the old sort algorithm
    tasks.sort((a, b) => {
      return (
        ((a?.sortOrder as unknown as number) || 0) - ((b?.sortOrder as unknown as number) || 0)
      );
    });

    // Update the sortOrder to be a fractional string
    const keys = generateNKeysBetween(null, null, tasks.length);

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      task!.sortOrder = keys[i];
      await db.put(task!);
    }

    // Update the migrations document to reflect the new version
    const migrationsDoc = await db.get<MigrationsDoc>('migrations');
    migrationsDoc.version = 4;
    await db.put(migrationsDoc);
  }
}

export default V4UpdateSortsToFractionalString;
