import { Preferences } from '@/data/documentTypes/Preferences';
import { Factory } from './Factory';

export class PreferencesFactory implements Factory<Preferences> {
  create(data: Partial<Preferences> = {}): Preferences {
    return {
      _id: 'preferences',
      _rev: data._rev,
      type: 'preferences',

      lastSelectedContext: data.lastSelectedContext || 'context1',
    };
  }
}
