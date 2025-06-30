import { Task, TaskStatus } from '@/data/documentTypes/Task';

export const taskFactory = (data: Partial<Task> = {}): Task => {
  return {
    _id: `task-${data._id?.replace('task-', '') || 'default'}`,
    _rev: data._rev,

    type: 'task',
    title: data.title || 'A task',
    sortOrder: data.sortOrder || 'g',
    description: data.description || 'This is a sample task description.',
    tags: data.tags || [],
    status: data.status || TaskStatus.Ready,
    context: data.context || 'Work',
    priority: data.priority || 1,
    dueDate: data.dueDate || undefined,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };
};
