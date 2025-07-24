import { MigrationsDoc } from '@/data/documentTypes/MigrationsDoc';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';
import { Migration } from '../Migration';

class V8UpdateRecurrenceParamsToNumbers implements Migration {
  getVersion(): number {
    return 8;
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
    const allTasks = results.rows.map((row) => row.doc as Task);
    const recurringTasks = allTasks.filter((task) => task.status === TaskStatus.Recurring);

    recurringTasks.forEach((task) => {
      if (task.recurrence) {
        if (task.recurrence.dayOfWeek !== undefined) {
          task.recurrence.dayOfWeek = parseInt(String(task.recurrence.dayOfWeek), 10);
        }
        if (task.recurrence.dayOfMonth !== undefined) {
          task.recurrence.dayOfMonth = parseInt(String(task.recurrence.dayOfMonth), 10);
        }
        if (task.recurrence.ends?.afterOccurrences !== undefined) {
          task.recurrence.ends.afterOccurrences = parseInt(
            String(task.recurrence.ends.afterOccurrences),
            10
          );
        }

        // Ensure interval is a number
        task.recurrence.interval = parseInt(String(task.recurrence.interval), 10);

        // Update the task in the database
        db.put(task).catch((error) => {
          Logger.error(`Failed to update task ${task._id}:`, error);
        });
      }
    });

    // Update the migrations document to reflect the new version
    const migrationsDoc = await db.get<MigrationsDoc>('migrations');
    migrationsDoc.version = 8;
    await db.put(migrationsDoc);
  }
}

export default V8UpdateRecurrenceParamsToNumbers;
