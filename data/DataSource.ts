import { Preferences } from '@/data/documentTypes/Preferences';
import { Task, TaskStatus } from '@/data/documentTypes/Task';

export type getTasksParams = {
  context?: string;
  statuses?: TaskStatus[];
};

export type UnsubscribeFunction = () => void;
export type ContextSubscriber = (contexts: string[]) => void;

export interface DataSource {
  getPreferences: () => Promise<Preferences>;
  setPreferences: (preferences: Preferences) => Promise<void>;
  getTasks: (params: getTasksParams) => Promise<Task[]>;
  getContexts: () => Promise<string[]>;
  addContext: (context: string) => Promise<void>;
  subscribeToContexts: (callback: ContextSubscriber) => UnsubscribeFunction;
}
