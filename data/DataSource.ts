import { Preferences } from '@/data/documentTypes/Preferences';
import { NewTask, Task, TaskStatus } from '@/data/documentTypes/Task';

export type getTasksParams = {
  context?: string;
  statuses?: TaskStatus[];
};

export type UnsubscribeFunction = () => void;

export type TaskSubscriber = (tasks: Task[]) => void;
export type ContextSubscriber = (contexts: string[]) => void;

export interface DataSource {
  getPreferences: () => Promise<Preferences>;
  setPreferences: (preferences: Preferences) => Promise<void>;
  addTask: (task: NewTask) => Promise<void>;
  getTasks: (params: getTasksParams) => Promise<Task[]>;
  subscribeToTasks: (params: getTasksParams, callback: TaskSubscriber) => UnsubscribeFunction;
  getContexts: () => Promise<string[]>;
  addContext: (context: string) => Promise<void>;
  subscribeToContexts: (callback: ContextSubscriber) => UnsubscribeFunction;
}
