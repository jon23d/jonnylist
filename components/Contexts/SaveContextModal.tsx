import { useState } from 'react';
import { Button, Modal, Text, TextInput } from '@mantine/core';
import { TaskFilter } from '@/components/Tasks/FilterSelector';
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
  const handleSave = () => {
    Logger.info('Saving context', filter);
    Notifications.show({
      title: 'Coming soon',
      message: 'This feature is not yet implemented. Stay tuned!',
      color: 'orange',
    });
  };

  const [contextName, setContextName] = useState<string>('');
  return (
    <Modal title="Save Context?" opened={opened} onClose={onClose}>
      <Text>This will save the filter as a context and make it available for future use</Text>
      <TextInput
        label="Context Name"
        value={contextName}
        onChange={(e) => setContextName(e.currentTarget.value)}
      />
      <Button onClick={handleSave}>Save</Button>
      <Button onClick={onClose}>Cancel</Button>
    </Modal>
  );
}
