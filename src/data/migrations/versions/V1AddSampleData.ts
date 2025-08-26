import dayjs from 'dayjs';
import { DocumentTypes } from '@/data/documentTypes';
import { MigrationsDoc } from '@/data/documentTypes/MigrationsDoc';
import { TaskStatus } from '@/data/documentTypes/Task';
import { TaskRepository } from '@/data/TaskRepository';
import { Migration } from '../Migration';

class V1AddSampleData implements Migration {
  getVersion(): number {
    return 1;
  }

  async needsMigration(db: PouchDB.Database): Promise<boolean> {
    const migrations = await db.get<MigrationsDoc>('migrations');
    return !(migrations && migrations.version >= this.getVersion());
  }

  async up(db: PouchDB.Database): Promise<void> {
    // Add sample data
    const sampleTasks = [
      {
        title: 'Star Jonnylist on github',
        description: 'Visit https://github.com/jon23d/jonnylist',
        tags: ['getting-started'],
        dueDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        status: TaskStatus.Ready,
      },
      {
        title: 'Create a filter and save it as a context',
        tags: ['getting-started'],
        project: 'Jonnylist',
        status: TaskStatus.Ready,
      },
    ];

    const taskRepository = new TaskRepository(db as PouchDB.Database<DocumentTypes>);
    for (const task of sampleTasks) {
      await taskRepository.addTask(task);
    }
  }
}

export default V1AddSampleData;
