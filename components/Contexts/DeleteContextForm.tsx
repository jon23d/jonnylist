import React from 'react';
import { useRouter } from 'next/router';
import { Button, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useContextRepository } from '@/contexts/DataSourceContext';
import { Context } from '@/data/documentTypes/Context';
import { Notifications } from '@/helpers/Notifications';

export default function DeleteContextForm({
  context,
  onClose,
}: {
  context: Context;
  onClose: () => void;
}) {
  const router = useRouter();
  const contextRepository = useContextRepository();

  const handleSubmit = () => {
    modals.openConfirmModal({
      title: 'Delete this context?',
      children: <Text size="sm">Are you sure you want to delete the context?</Text>,
      labels: { confirm: 'Yes, delete the context', cancel: 'No, do not' },
      onCancel: () => onClose(),
      onConfirm: async () => await doDelete(),
    });
  };

  const doDelete = async () => {
    try {
      await contextRepository.deleteContext(context);
      await router.push('/');
      Notifications.showSuccess({ title: 'Success', message: 'Context deleted successfully.' });
    } catch (error) {
      Notifications.showError({
        title: 'Error',
        message: `Failed to delete context: ${error}`,
      });
    }
    onClose();
  };

  const handleCancel = async () => {
    onClose();
  };

  return (
    <Stack>
      <Text>This action cannot be undone.</Text>
      <Button type="submit" onClick={handleSubmit}>
        Delete Context
      </Button>
      <Button onClick={handleCancel}>Cancel</Button>
    </Stack>
  );
}
