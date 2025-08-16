import { Task, TaskPriority, TaskStatus } from '@/data/documentTypes/Task';

export const taskFactory = (data: Partial<Task> = {}): Task => {
  return {
    _id: `task-${data._id?.replace('task-', '') || 'default'}`,
    _rev: data._rev,

    type: 'task',
    title: data.title || 'A task',
    description:
      data.description !== undefined ? data.description : 'This is a sample task description.',
    tags: data.tags || [],
    project: data.project !== undefined ? data.project : 'a project',
    status: data.status || TaskStatus.Ready,
    priority: data.priority || TaskPriority.Medium,
    dueDate: data.dueDate || undefined,
    waitUntil: data.waitUntil || undefined,
    notes: data.notes || [],
    recurrence: data.recurrence || undefined,
    recurrenceTemplateId: data.recurrenceTemplateId || undefined,
    completedAt: data.completedAt || (data.status === TaskStatus.Done ? new Date() : undefined),
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };
};
