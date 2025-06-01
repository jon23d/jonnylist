import { Common } from '@/data/documentTypes/Common';

export enum TaskStatus {
  Ready = 'ready',
  Waiting = 'waiting',
  Started = 'started',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export const taskStatusSelectOptions = [
  { value: TaskStatus.Ready, label: 'Ready' },
  { value: TaskStatus.Waiting, label: 'Waiting' },
  { value: TaskStatus.Started, label: 'Started' },
  { value: TaskStatus.Completed, label: 'Completed' },
  { value: TaskStatus.Cancelled, label: 'Cancelled' },
];

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

export interface NewTask {
  context: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number;
  dueDate?: Date;
}
