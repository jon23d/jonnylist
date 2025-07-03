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
  { value: TaskStatus.Started, label: 'Started' },
  { value: TaskStatus.Waiting, label: 'Waiting' },
  { value: TaskStatus.Ready, label: 'Ready' },
  { value: TaskStatus.Done, label: 'Done' },
  { value: TaskStatus.Cancelled, label: 'Cancelled' },
];

export enum TaskPriority {
  Low = 'L',
  Medium = 'M',
  High = 'H',
}

export const taskPrioritySelectOptions = [
  { value: TaskPriority.Low, label: 'Low' },
  { value: TaskPriority.Medium, label: 'Medium' },
  { value: TaskPriority.High, label: 'High' },
];

export interface Task extends Common {
  context: string;
  type: 'task';
  title: string;
  description?: string;
  tags?: string[];
  project?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NewTask = Omit<Task, keyof Common | 'type' | 'createdAt' | 'updatedAt'>;
