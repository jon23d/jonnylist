import { LocalSettings } from '@/data/documentTypes/LocalSettings';

export const localSettingsFactory = (data: Partial<LocalSettings> = {}): LocalSettings => {
  return {
    _id: '_local/settings',
    ...data,
  };
};
