import { useEffect } from 'react';
import { Button, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDataSource } from '@/contexts/DataSourceContext';
import { Logger } from '@/helpers/Logger';
import { Notifications } from '@/helpers/Notifications';

export default function SyncServerForm() {
  const dataSource = useDataSource();

  const form = useForm({
    initialValues: {
      serverUrl: '',
      accessToken: '',
    },
    validate: {
      serverUrl: (value) => (value ? null : 'Server URL is required'),
      accessToken: (value) => (value ? null : 'Access token is required'),
    },
  });

  useEffect(() => {
    dataSource.getLocalSettings().then(
      (settings) => {
        form.setValues({
          serverUrl: settings.syncServerUrl || '',
          accessToken: settings.syncServerAccessToken || '',
        });
      },
      (error) => {
        Logger.error('Failed to load local settings', error);
        Notifications.showError({
          title: 'Error',
          message: 'Failed to load sync server settings. Please try again.',
        });
      }
    );
  }, [dataSource]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const localSettings = await dataSource.getLocalSettings();
      const updatedSettings = {
        ...localSettings,
        syncServerUrl: values.serverUrl,
        syncServerAccessToken: values.accessToken,
      };
      await dataSource.setLocalSettings(updatedSettings);
      Notifications.showSuccess({
        title: 'Success',
        message: 'Sync server settings updated successfully.',
      });
    } catch (error) {
      Logger.error('Failed to update sync server settings', error);
      Notifications.showError({
        title: 'Error',
        message: 'Failed to update sync server settings. Please try again.',
      });
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput label="Server URL" {...form.getInputProps('serverUrl')} />
        <TextInput label="Access Token" {...form.getInputProps('accessToken')} />
        <Button type="submit">Log in</Button>
      </Stack>
    </form>
  );
}
