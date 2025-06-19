import { DataSource } from '@/data/DataSource';
import { TaskStatus } from '@/data/documentTypes/Task';

export class TaskMover {
  constructor(private dataSource: DataSource) {}

  async moveIncompleteTasksToNewContext(oldContext: string, newContext: string): Promise<void> {
    const tasks = await this.dataSource.getTasks({
      context: oldContext,
      statuses: [TaskStatus.Ready, TaskStatus.Waiting, TaskStatus.Started],
    });

    if (tasks.length === 0) {
      return;
    }

    const updatedTasks = tasks.map((task) => ({
      ...task,
      context: newContext,
    }));

    await this.dataSource.updateTasks(updatedTasks);
  }
}
