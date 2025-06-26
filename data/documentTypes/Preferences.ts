import { Common } from '@/data/documentTypes/Common';

export interface Preferences extends Common {
  lastSelectedContext: string;
}

export function createDefaultPreferences(): Preferences {
  return {
    _id: 'preferences',
    type: 'preferences',
    lastSelectedContext: '',
  };
}
