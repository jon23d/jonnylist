import { Button, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDataSource } from '@/contexts/DataSourceContext';
import { LocalSettings } from '@/data/documentTypes/LocalSettings';
import { Logger } from '@/helpers/Logger';
import { Notifications } from '@/helpers/Notifications';

export default function SyncServerForm({ localSettings }: { localSettings: LocalSettings }) {
  const dataSource = useDataSource();

  const isUrlValid = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const form = useForm<{
    serverUrl: string;
    accessToken: string;
  }>({
    initialValues: {
      serverUrl: localSettings.syncServerUrl || '',
      accessToken: localSettings.syncServerAccessToken || '',
    },
    validate: {
      serverUrl: (value) => (isUrlValid(value) ? null : 'Server URL is required'),
      accessToken: (value) => (value ? null : 'Access token is required'),
    },
  });

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

    await initializeSync();
  };

  const initializeSync = async () => {
    try {
      await dataSource.initializeSync();

      Notifications.showSuccess({
        title: 'Sync Initialized',
        message: 'Syncing has been initialized with the new settings.',
      });
    } catch (error) {
      Logger.error('Failed to initialize sync after settings update', error);
      Notifications.showError({
        title: 'Sync Initialization Error',
        message:
          'Failed to initialize syncing with the new settings. Please check your configuration.',
      });
      dataSource.cancelSync();
    }
  };

  const handleLogout = async () => {
    dataSource.cancelSync();
    const localSettings = await dataSource.getLocalSettings();
    const updatedSettings = {
      ...localSettings,
      syncServerUrl: '',
      syncServerAccessToken: '',
    };
    await dataSource.setLocalSettings(updatedSettings);
    form.setValues(
      { serverUrl: '', accessToken: '' } // Reset form values after logout
    );
    Notifications.showSuccess({
      title: 'Logged Out',
      message: 'You have been logged out from the sync server.',
    });
  };

  const isLogoutButtonDisabled = !form.values.serverUrl && !form.values.accessToken;

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput label="Server URL" {...form.getInputProps('serverUrl')} />
        <TextInput label="Access Token" {...form.getInputProps('accessToken')} />
        <Button type="submit">Log in</Button>
        <Button color="orange.5" onClick={handleLogout} disabled={isLogoutButtonDisabled}>
          Log out
        </Button>
      </Stack>
    </form>
  );
}
