import { LocalSettings } from '@/data/documentTypes/LocalSettings';
import { Factory } from './Factory';

export class LocalSettingsFactory implements Factory<LocalSettings> {
  create(data: Partial<LocalSettings> = {}): LocalSettings {
    return {
      _id: '_local/settings',
      ...data,
    };
  }
}
