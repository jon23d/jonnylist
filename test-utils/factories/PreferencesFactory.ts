import { Preferences } from '@/data/documentTypes/Preferences';
import { TaskStatus } from '@/data/documentTypes/Task';

export const preferencesFactory = (data: Partial<Preferences> = {}): Preferences => {
  return {
    _id: 'preferences',
    _rev: data._rev,
    type: 'preferences',

    lastSelectedContext: data.lastSelectedContext || 'context1',
    lastSelectedStatuses: data.lastSelectedStatuses || [TaskStatus.Started],
    coefficients: data.coefficients || {},
  };
};
