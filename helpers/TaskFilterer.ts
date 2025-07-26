import { Task, TaskFilter } from '@/data/documentTypes/Task';
import { getTasksParams } from '@/data/TaskRepository';

export class TaskFilterer {
  constructor(private readonly filter: TaskFilter & getTasksParams) {}

  filterTasks(tasks: Task[]): Task[] {
    let filteredTasks = this.filterByStatus(tasks);
    filteredTasks = this.filterByIsDue(filteredTasks);

    return filteredTasks;
  }

  private filterByStatus(tasks: Task[]): Task[] {
    const { statuses } = this.filter;

    return statuses?.length ? tasks.filter((task) => statuses.includes(task.status)) : tasks;
  }

  private filterByIsDue(tasks: Task[]): Task[] {
    const { due } = this.filter;
    if (!due) {
      return tasks;
    }

    const now = new Date();
    return tasks.filter((task) => task.dueDate && now >= new Date(task.dueDate));
  }
}
