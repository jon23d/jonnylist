import React, { useState } from 'react';
import { Button, FocusTrap, Stack, TextInput } from '@mantine/core';
import { useContextRepository } from '@/contexts/DataSourceContext';
import { Context } from '@/data/documentTypes/Context';
import { Notifications } from '@/helpers/Notifications';

export default function RenameContextForm({
  context,
  onClose,
}: {
  context: Context;
  onClose: () => void;
}) {
  const contextRepository = useContextRepository();
  const [formError, setFormError] = useState('');

  const [contextName, setContextName] = useState<string>(context.name);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (contextName.trim() === '') {
      setFormError('Context name cannot be empty.');
      return;
    }

    try {
      await contextRepository.updateContext({
        ...context,
        name: contextName,
      });

      setContextName('');
      onClose();
    } catch (error) {
      Notifications.showError({
        title: 'Error',
        message: `Failed to rename context: ${error}`,
      });
    }
  };

  const handleCancel = async () => {
    setContextName('');
    onClose();
  };

  return (
    <form>
      <FocusTrap>
        <Stack>
          <TextInput
            label="Context Name"
            value={contextName}
            onChange={(e) => setContextName(e.currentTarget.value)}
            data-autofocus
            error={formError}
          />
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={contextName.length === 0 || contextName === context.name}
          >
            Rename Context
          </Button>
          <Button onClick={handleCancel}>Cancel</Button>
        </Stack>
      </FocusTrap>
    </form>
  );
}
