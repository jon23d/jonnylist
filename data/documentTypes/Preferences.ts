import { Common } from '@/data/documentTypes/Common';
import { TaskStatus } from '@/data/documentTypes/Task';

export interface Preferences extends Common {
  lastSelectedContext: string;
  lastSelectedStatuses?: TaskStatus[];
}

export function createDefaultPreferences(): Preferences {
  return {
    _id: 'preferences',
    type: 'preferences',
    lastSelectedContext: '',
    lastSelectedStatuses: [TaskStatus.Ready],
  };
}
