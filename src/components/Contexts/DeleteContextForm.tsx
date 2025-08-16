import React from 'react';
import { useNavigate } from 'react-router';
import { Button, Stack, Text } from '@mantine/core';
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
  const navigate = useNavigate();
  const contextRepository = useContextRepository();

  const handleSubmit = async () => {
    try {
      await contextRepository.deleteContext(context);
      navigate('/');
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
