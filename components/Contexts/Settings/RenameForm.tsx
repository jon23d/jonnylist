import { Button, Flex, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Notifications } from '@/helpers/Notifications';

export default function RenameForm({
  contextName,
  onClose,
}: {
  contextName: string;
  onClose: () => void;
}) {
  const form = useForm({
    initialValues: {
      contextName,
    },
  });

  const handleSubmit = () => {
    Notifications.showError({
      title: 'How horrific',
      message: 'This feature is not yet implemented',
    });
    onClose();
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Flex align="end" justify="space-between">
        <TextInput
          value={contextName}
          label="Context name"
          {...form.getInputProps('contextName')}
        />
        <Button disabled={form.values.contextName === contextName} type="submit">
          Update name
        </Button>
      </Flex>
    </form>
  );
}
