import { Preferences } from '@/data/documentTypes/Preferences';

export const preferencesFactory = (data: Partial<Preferences> = {}): Preferences => {
  return {
    _id: 'preferences',
    _rev: data._rev,
    type: 'preferences',

    lastSelectedContext: data.lastSelectedContext || 'context1',
  };
};
