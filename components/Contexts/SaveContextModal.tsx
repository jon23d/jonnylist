import { useState } from 'react';
import { Button, FocusTrap, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useContextRepository } from '@/contexts/DataSourceContext';
import { TaskFilter } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';
import { Notifications } from '@/helpers/Notifications';

export default function SaveContextModal({
  filter,
  opened,
  onClose,
}: {
  filter: TaskFilter;
  opened: boolean;
  onClose: () => void;
}) {
  const contextRepository = useContextRepository();
  const [contextName, setContextName] = useState<string>('');

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    Logger.info('Saving context', filter);
    await contextRepository.addContext({
      name: contextName,
      filter,
    });
    Notifications.showSuccess({
      title: 'Success!',
      message: 'Your context was created',
    });
    setContextName('');
    onClose();
  };

  return (
    <Modal title="Save Context?" opened={opened} onClose={onClose}>
      <form onSubmit={handleSave}>
        <FocusTrap>
          <Stack>
            <Text>This will save the filter as a context and make it available for future use</Text>
            <TextInput
              label="Context Name"
              value={contextName}
              onChange={(e) => setContextName(e.currentTarget.value)}
              data-autofocus
            />
            <Group>
              <Button onClick={handleSave} disabled={!contextName}>
                Save
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </Group>
          </Stack>
        </FocusTrap>
      </form>
    </Modal>
  );
}
