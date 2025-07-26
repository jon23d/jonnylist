import { Task, TaskFilter } from '@/data/documentTypes/Task';

const MS_IN_A_DAY = 1000 * 60 * 60 * 24;

export class TaskFilterer {
  constructor(private readonly filter: TaskFilter) {}

  filterTasks(tasks: Task[]): Task[] {
    let filteredTasks = this.filterByStatus(tasks);
    filteredTasks = this.filterByTags(filteredTasks);
    filteredTasks = this.filterByIsDue(filteredTasks);
    filteredTasks = this.filterByProjects(filteredTasks);
    filteredTasks = this.filterByPriority(filteredTasks);
    filteredTasks = this.filterByDueDate(filteredTasks);

    return filteredTasks;
  }

  filterByStatus(tasks: Task[]): Task[] {
    const { statuses } = this.filter;

    return statuses?.length ? tasks.filter((task) => statuses.includes(task.status)) : tasks;
  }

  filterByIsDue(tasks: Task[]): Task[] {
    const { due } = this.filter;
    if (!due) {
      return tasks;
    }

    const now = new Date();
    return tasks.filter((task) => task.dueDate && now >= new Date(task.dueDate));
  }

  filterByTags(tasks: Task[]): Task[] {
    const { requireTags, excludeTags } = this.filter;

    return tasks.filter((task) => {
      const hasRequiredTags = requireTags
        ? requireTags.every((tag) => task.tags?.includes(tag))
        : true;
      const hasExcludedTags = excludeTags
        ? !excludeTags.some((tag) => task.tags?.includes(tag))
        : true;

      return hasRequiredTags && hasExcludedTags;
    });
  }

  filterByProjects(tasks: Task[]): Task[] {
    const { requireProjects, excludeProjects } = this.filter;

    return tasks.filter((task) => {
      const hasRequiredProjects =
        requireProjects && requireProjects.length
          ? requireProjects.some((project) => task.project?.startsWith(project))
          : true;
      const hasExcludedProjects =
        excludeProjects && excludeProjects.length
          ? !excludeProjects.some((project) => task.project?.startsWith(project))
          : true;

      const hasNoProject = this.filter.hasNoProject ? !task.project : true;

      return hasRequiredProjects && hasExcludedProjects && hasNoProject;
    });
  }

  filterByPriority(tasks: Task[]): Task[] {
    const { requirePriority, excludePriority } = this.filter;

    return tasks.filter((task) => {
      const hasRequiredPriority =
        requirePriority && requirePriority.length
          ? requirePriority.some((priority) => priority === task.priority)
          : true;
      const hasExcludedPriority =
        excludePriority && excludePriority.length
          ? excludePriority.some((priority) => priority === task.priority)
          : false;

      return hasRequiredPriority && !hasExcludedPriority;
    });
  }

  filterByDueDate(tasks: Task[]): Task[] {
    const { dueWithin } = this.filter;
    if (!dueWithin?.maximumNumberOfDaysFromToday) {
      return tasks;
    }

    const now = new Date();

    return tasks.filter((task) => {
      if (!task.dueDate) {
        return false;
      }
      const dueDate = new Date(task.dueDate);
      const dueInDays = Math.ceil((dueDate.getTime() - now.getTime()) / MS_IN_A_DAY);
      const minimumDays = dueWithin.minimumNumberOfDaysFromToday || 0;
      const maximumDays = dueWithin.maximumNumberOfDaysFromToday!;
      const includeOverdueTasks = dueWithin.includeOverdueTasks || false;

      // Check if the task's due date falls within the specified range
      if (!includeOverdueTasks && dueInDays < 0) {
        return false;
      }

      if (dueInDays > 0 && (dueInDays < minimumDays || dueInDays > maximumDays)) {
        return false;
      }
      return true;
    });
  }
}
