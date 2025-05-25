import { DataSource, getTasksParams, Task } from '@/data/DataSource';

class LocalDataSource implements DataSource {
  private createSchema(): void {
    // Create a localDb schema for tasks
    // This is a placeholder for the actual implementation
    // You would typically use a library like Dexie.js or localForage to create a schema
  }

  async getTasks(_params: getTasksParams): Promise<Task[]> {
    return Promise.resolve([]);
  }
}
