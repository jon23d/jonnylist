import { Common } from '@/data/documentTypes/Common';

export interface LocalSettings extends Common {
  _id: 'localSettings';
  syncServerUrl: string;
  syncServerDatabase: string;
  syncServerAccessToken: string;
}
