import { Common } from '@/data/documentTypes/Common';

export interface TagMeta {
  count: number; // Number of tasks associated with this tag
  lastUsed: string; // ISO date string of the last time this tag was used
}

export interface LocalSettings extends Common {
  _id: '_tags';
  tags: Record<string, TagMeta>;
}
