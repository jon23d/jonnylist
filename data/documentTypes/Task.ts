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
  { value: TaskStatus.Ready, label: 'Ready' },
  { value: TaskStatus.Waiting, label: 'Waiting' },
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
  sortOrder: string;
  description?: string;
  tags?: string[];
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewTask {
  context: string;
  title: string;
  description?: string;
  tags?: string[];
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export function sortedTasks(tasks: Task[]): Task[] {
  // We cannot use a local-aware sort because we need a consistent
  // lexicographical comparison order across different locales.
  return [...tasks].sort((a, b) => {
    const sortA = a.sortOrder.toString();
    const sortB = b.sortOrder.toString();
    return sortA < sortB ? -1 : sortA > sortB ? 1 : 0;
  });
}
