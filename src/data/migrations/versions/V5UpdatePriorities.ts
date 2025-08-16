import { MigrationsDoc } from '@/data/documentTypes/MigrationsDoc';
import { Task, TaskPriority } from '@/data/documentTypes/Task';
import { Migration } from '../Migration';

interface OldTask extends Omit<Task, 'priority'> {
  priority: number;
}

class V5UpdatePriorities implements Migration {
  getVersion(): number {
    return 5;
  }

  convertNumericPriority(priority: number): TaskPriority | undefined {
    if (!priority || priority < 2) {
      return undefined;
    }
    if (priority >= 2 && priority <= 3) {
      return TaskPriority.Low;
    }
    if (priority <= 6) {
      return TaskPriority.Medium;
    }
    return TaskPriority.High;
  }

  async needsMigration(db: PouchDB.Database): Promise<boolean> {
    const migrations = await db.get<MigrationsDoc>('migrations');
    return !(migrations && migrations.version >= this.getVersion());
  }

  async up(db: PouchDB.Database): Promise<void> {
    const tasks = await db.allDocs<OldTask>({
      include_docs: true,
      startkey: 'task-',
    });

    const updatedTasks = tasks.rows.map((row) => {
      const oldTask = row.doc as OldTask;
      const newTask: Task = {
        ...oldTask,
        priority: this.convertNumericPriority(oldTask.priority),
      };
      return newTask;
    });

    await db.bulkDocs(updatedTasks);

    // Update the migrations document to reflect the new version
    const migrationsDoc = await db.get<MigrationsDoc>('migrations');
    migrationsDoc.version = 5;
    await db.put(migrationsDoc);
  }
}

export default V5UpdatePriorities;
