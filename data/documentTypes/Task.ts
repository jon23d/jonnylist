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

export interface Task extends Common {
  context: string;
  type: 'task';
  title: string;
  sortOrder: string;
  description?: string;
  status: TaskStatus;
  priority: number; // Higher number means higher priority
  dueDate?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface NewTask {
  context: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number;
  dueDate?: string;
}

export function sortedTasks(tasks: Task[]): Task[] {
  return tasks.toSorted((a, b) => {
    const sortA = a.sortOrder.toString();
    const sortB = b.sortOrder.toString();
    if (sortA < sortB) {
      return -1; // a comes before b
    }
    if (sortA > sortB) {
      return 1; // a comes after b
    }
    return 0; // a and b are equal
  });
}
