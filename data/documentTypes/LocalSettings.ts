import { Common } from '@/data/documentTypes/Common';

export interface LocalSettings extends Common {
  _id: '_local/settings';
  syncServerUrl?: string;
  syncServerAccessToken?: string;
  visibleTaskColumns?: string[];
}
