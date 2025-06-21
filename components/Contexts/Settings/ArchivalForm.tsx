import { IconInfoCircle } from '@tabler/icons-react';
import { Alert, Button, Radio, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { useBulkOperationOverlay } from '@/contexts/BulkOperationOverlayContext';
import { useDataSource } from '@/contexts/DataSourceContext';
import { Notifications } from '@/helpers/Notifications';

export default function ArchivalForm({
  sourceContext,
  destinationContexts,
  onClose,
}: {
  sourceContext: string;
  destinationContexts: string[];
  onClose: () => void;
}) {
  const dataSource = useDataSource();
  const { showOverlay, hideOverlay } = useBulkOperationOverlay();

  const form = useForm({
    initialValues: {
      destinationContext: '',
    },
  });

  const handleSubmit = () => {
    modals.openConfirmModal({
      title: 'Archive Context?',
      children: (
        <Text size="sm">
          This action cannot be undone. All open tasks in the `{sourceContext}` context will be
          moved to the `{form.values.destinationContext}` context, and the `{sourceContext}` context
          will be archived.
        </Text>
      ),
      labels: { confirm: 'Archive my context', cancel: 'Cancel' },
      confirmProps: { color: 'orange' },
      onConfirm: handleConfirm,
    });
  };

  const handleConfirm = async () => {
    showOverlay({
      title: 'Archiving Context',
      description: `Hold tight while we archive the ${sourceContext} context.`,
    });

    await dataSource.archiveContext(sourceContext, form.values.destinationContext);

    await hideOverlay();

    Notifications.showSuccess({
      title: 'Context Archived',
      message: `Tasks from ${sourceContext} have been moved to ${form.values.destinationContext}.`,
    });

    onClose();
  };

  return (
    <>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Alert color="orange" icon={<IconInfoCircle />}>
          <Text mb={20}>All open tasks will be moved to a new context during archival.</Text>
          <Text>Open tasks are those with a status of Ready, Waiting, or Started.</Text>
        </Alert>

        <Radio.Group
          {...form.getInputProps('destinationContext')}
          label={<Text mb={10}>Choose destination context</Text>}
          mt={20}
        >
          <Stack>
            {destinationContexts.map((c) => (
              <Radio value={c} label={c} key={c} />
            ))}
          </Stack>
        </Radio.Group>

        <Button
          color="red"
          fullWidth
          mt={20}
          disabled={!form.values.destinationContext}
          type="submit"
        >
          Archive
        </Button>
      </form>
    </>
  );
}
