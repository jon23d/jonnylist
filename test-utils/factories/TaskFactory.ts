import { Task, TaskStatus } from '@/data/interfaces/Task';
import { Factory } from './Factory';

export class TaskFactory implements Factory<Task> {
  create(data: Partial<Task> = {}): Task {
    return {
      _id: `task-${data._id?.replace('task-', '') || 'default'}`,
      version: data.version || 1,
      _rev: data._rev,

      type: 'task',
      title: data.title || 'A task',
      description: data.description || 'This is a sample task description.',
      status: data.status || TaskStatus.Ready,
      context: data.context || 'Work',
      priority: data.priority || 1,
      dueDate: data.dueDate || undefined,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
  }
}
