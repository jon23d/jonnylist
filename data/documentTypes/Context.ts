import { Common } from '@/data/documentTypes/Common';
import { TaskFilter } from '@/data/documentTypes/Task';

export interface Context extends Common {
  type: 'context';
  name: string;
  filter: TaskFilter;
}

export type NewContext = Omit<Context, '_id' | '_rev' | 'type'>;
