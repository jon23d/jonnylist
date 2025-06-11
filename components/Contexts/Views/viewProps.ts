import { Task, TaskStatus } from '@/data/documentTypes/Task';

export type ViewProps = {
  tasks: Task[];
  visibleStatuses: TaskStatus[];
};
