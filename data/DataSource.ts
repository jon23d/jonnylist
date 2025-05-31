import { Task, TaskStatus } from '@/data/interfaces/Task';

export type getTasksParams = {
  context?: string;
  statuses?: TaskStatus[];
};

export type UnsubscribeFunction = () => void;
export type ContextSubscriber = (contexts: string[]) => void;

export interface DataSource {
  getTasks: (params: getTasksParams) => Promise<Task[]>;
  getContexts: () => Promise<string[]>;
  addContext: (context: string) => Promise<void>;
  subscribeToContexts: (callback: ContextSubscriber) => UnsubscribeFunction;
}
