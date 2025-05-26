import { DataSource, getTasksParams, Task } from '@/data/DataSource';

export class LocalDataSource implements DataSource {
  async getTasks(_params: getTasksParams): Promise<Task[]> {
    return Promise.resolve([]);
  }

  async getContexts(): Promise<string[]> {
    return ['home', 'work', 'errands'];
  }
}
