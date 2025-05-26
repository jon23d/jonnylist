export enum TaskStatus {
  Ready = 'ready',
  Started = 'started',
  Completed = 'completed',
  WontDo = 'wontdo',
}

export type getTasksParams = {
  context?: string;
  status?: TaskStatus;
};

export type Task = {
  id: string;
  name: string;
  status: TaskStatus;
  context?: string;
  createdAt: string;
  updatedAt: string;
};

export interface DataSource {
  getTasks: (params: getTasksParams) => Promise<Task[]>;
  getContexts: () => Promise<string[]>;
  addContext: (context: string) => Promise<void>;
}
