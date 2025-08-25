import { Task } from '@/data/documentTypes/Task';
import V10ConvertTagsToLowercase from '@/data/migrations/versions/V10ConvertTagsToLowercase';
import { createTestDataSource } from '@/test-utils/db';
import { taskFactory } from '@/test-utils/factories/TaskFactory';

describe('V10LowercaseTags', () => {
  it('should lowercase all tags', async () => {
    const { database: db } = createTestDataSource();

    await db.put(taskFactory({ _id: 'task-1', tags: ['Home', 'Garden', 'DIY'] }));
    await db.put(taskFactory({ _id: 'task-2', tags: ['Work', 'PROJECT', 'Urgent'] }));
    await db.put(taskFactory({ _id: 'task-3', tags: ['Health', 'Fitness'] }));
    await db.put(taskFactory({ _id: 'task-4', tags: ['no-case-change'] }));
    await db.put(taskFactory({ _id: 'task-5' }));

    // Set migrations doc so we don't run all migrations
    await db.put({
      _id: 'migrations',
      version: 9,
    } as any);

    const migration = new V10ConvertTagsToLowercase();
    await migration.up(db);

    const tasks = await db.allDocs<Task>({
      include_docs: true,
      keys: ['task-1', 'task-2', 'task-3', 'task-4', 'task-5'],
    });
    const tags = tasks.rows
      .map((row: any) => row.doc?.tags)
      .flat()
      .filter(Boolean);

    expect(tags).toEqual(
      expect.arrayContaining([
        'home',
        'garden',
        'diy',
        'work',
        'project',
        'urgent',
        'health',
        'fitness',
        'no-case-change',
      ])
    );
  });
});
