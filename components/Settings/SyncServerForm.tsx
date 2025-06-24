import { Button, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Logger } from '@/helpers/Logger';
import { Notifications } from '@/helpers/Notifications';

export default function SyncServerForm() {
  const form = useForm({
    initialValues: {
      serverUrl: '',
      username: '',
      password: '',
    },
    validate: {
      serverUrl: (value) => (value ? null : 'Server URL is required'),
      username: (value) => (value ? null : 'Username is required'),
      password: (value) => (value ? null : 'Password is required'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    // We are going to try and log into the couchdb server
    await fetch(`${values.serverUrl}/_session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: values.username,
        password: values.password,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          Notifications.showSuccess({
            title: 'Login Failed',
            message: 'Please check your server URL and credentials.',
          });
        } else {
          return response.json();
        }
      })
      .then((data) => {
        Logger.info('Logged in successfully', data);
      })
      .catch((error) => {
        Logger.error('Login failed', error);
        form.setErrors({ serverUrl: 'Login failed. Please check your credentials.' });
      });
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput label="Server URL" {...form.getInputProps('serverUrl')} />
        <TextInput label="Username" {...form.getInputProps('username')} />
        <TextInput label="Password" {...form.getInputProps('password')} type="password" />
        <Button type="submit">Log in</Button>
      </Stack>
    </form>
  );
}
