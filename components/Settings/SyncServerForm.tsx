import { Button, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Logger } from '@/helpers/Logger';

export default function SyncServerForm() {
  const form = useForm({
    initialValues: {
      serverUrl: '',
      database: '',
      accessToken: '',
    },
    validate: {
      serverUrl: (value) => (value ? null : 'Server URL is required'),
      database: (value) => (value ? null : 'Database is required'),
      accessToken: (value) => (value ? null : 'Access token is required'),
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    // Here you would typically send the data to your server
    Logger.info('Sync settings saved:', values);
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput label="Server URL" {...form.getInputProps('serverUrl')} />
        <TextInput label="Database" {...form.getInputProps('database')} />
        <TextInput label="Access Token" {...form.getInputProps('accessToken')} type="password" />
        <Button type="submit">Save Sync Settings</Button>
      </Stack>
    </form>
  );
}
