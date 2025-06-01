import { Common } from '@/data/documentTypes/Common';

export enum TaskStatus {
  Ready = 'ready',
  Started = 'started',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Waiting = 'waiting',
}

export interface Task extends Common {
  context: string; // Reference to the context this task belongs to
  type: 'task';
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number; // Higher number means higher priority
  dueDate?: Date; // Optional due date

  createdAt: Date; // Timestamp of when the task was created
  updatedAt: Date; // Timestamp of the last update to the task
}
