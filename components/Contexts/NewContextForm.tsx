import { Button, FocusTrap, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDataSource } from '@/contexts/DataSourceContext';

export default function NewContextForm({ onClose }: { onClose: () => void }) {
  const dataSource = useDataSource();

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      newContextName: '',
    },
    validate: {
      newContextName: (value) => (value.trim() ? null : 'Context name is required'),
    },
    transformValues: (values) => ({
      newContextName: values.newContextName.trim(),
    }),
  });

  const handleSave = async () => {
    const newContextName = form.getTransformedValues().newContextName;
    await dataSource.addContext(newContextName);
    onClose();
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  return (
    <FocusTrap>
      <Stack gap="md">
        <form onSubmit={form.onSubmit(handleSave)}>
          <TextInput
            label="Context name"
            placeholder="e.g. Home, Work"
            withAsterisk
            data-autofocus
            {...form.getInputProps('newContextName')}
          />
          <Button type="submit">Save</Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </form>
      </Stack>
    </FocusTrap>
  );
}
