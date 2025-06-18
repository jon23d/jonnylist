import { Common } from '@/data/documentTypes/Common';

export interface Context extends Common {
  type: 'context';
  name: string;
  deletedAt?: Date | null;
}
