import { Common } from '@/data/interfaces/Common';

export interface Context extends Common {
  type: 'context';
  name: string;
}
