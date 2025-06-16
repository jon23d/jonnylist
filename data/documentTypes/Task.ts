import { Common } from '@/data/documentTypes/Common';

export enum TaskStatus {
  Ready = 'ready',
  Waiting = 'waiting',
  Started = 'started',
  Done = 'done',
  Cancelled = 'cancelled',
}
export const ALL_TASK_STATUSES: TaskStatus[] = Object.values(TaskStatus);

export const taskStatusSelectOptions = [
  { value: TaskStatus.Ready, label: 'Ready' },
  { value: TaskStatus.Waiting, label: 'Waiting' },
  { value: TaskStatus.Started, label: 'Started' },
  { value: TaskStatus.Done, label: 'Done' },
  { value: TaskStatus.Cancelled, label: 'Cancelled' },
];

export interface Task extends Common {
  context: string;
  type: 'task';
  title: string;
  sortOrder: number;
  description?: string;
  status: TaskStatus;
  priority: number; // Higher number means higher priority
  dueDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface NewTask {
  context: string;
  title: string;
  description?: string;
  sortOrder: number;
  status: TaskStatus;
  priority: number;
  dueDate?: Date;
}
