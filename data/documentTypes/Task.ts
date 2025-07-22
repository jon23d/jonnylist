import { Common } from '@/data/documentTypes/Common';

export enum TaskStatus {
  Ready = 'ready',
  Waiting = 'waiting',
  Started = 'started',
  Done = 'done',
  Cancelled = 'cancelled',
  Recurring = 'recurring',
}

export const taskStatusSelectOptions = [
  { value: TaskStatus.Started, label: 'Started' },
  { value: TaskStatus.Waiting, label: 'Waiting' },
  { value: TaskStatus.Ready, label: 'Ready' },
  { value: TaskStatus.Done, label: 'Done' },
  { value: TaskStatus.Cancelled, label: 'Cancelled' },
  { value: TaskStatus.Recurring, label: 'Recurring' },
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

export interface TaskFilter {
  requireTags?: string[];
  excludeTags?: string[];
  requireProjects?: string[];
  excludeProjects?: string[];
  requirePriority?: TaskPriority[];
  excludePriority?: TaskPriority[];
  dueWithin?: {
    includeOverdueTasks?: boolean;
    minimumNumberOfDaysFromToday?: number;
    maximumNumberOfDaysFromToday?: number;
  };
}

export interface Note {
  noteText: string;
  createdAt: string;
}

export interface Recurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  dayOfWeek?: number[]; // 0 for Sunday, 1 for Monday, etc.
  dayOfMonth?: number; // e.g., 1 for first, 2 for second, etc.
  ends?: {
    afterOccurrences?: number;
    onDate?: string;
  };
  yearlyFirstOccurrence?: string; // e.g., '2023-01-01'
}

export interface Task extends Common {
  type: 'task';
  title: string;
  description?: string;
  tags?: string[];
  project?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  waitUntil?: string;
  notes?: Note[];
  recurrence?: Recurrence;
  recurrenceTemplateId?: string; // ID of the recurrence template if this task was created from a recurring task
  createdAt: Date;
  updatedAt: Date;
}

export type NewTask = Omit<
  Task,
  keyof Common | 'type' | 'createdAt' | 'updatedAt' | 'notes' | 'recurrenceTemplateId'
>;
