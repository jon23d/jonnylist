import { useEffect, useState } from 'react';
import { Button, Modal, SimpleGrid, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ContextSummaryCard from '@/components/Contexts/ContextSummaryCard';
import NewContextForm from '@/components/Contexts/NewContextForm';
import { useContextRepository } from '@/contexts/DataSourceContext';

export default function ContextsPage() {
  const contextRepository = useContextRepository();

  const [contexts, setContexts] = useState<string[]>([]);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    const unsubscribe = contextRepository.subscribeToContexts(setContexts);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleAddContext = () => {
    open();
  };

  return (
    <>
      <Title order={1}>Contexts</Title>

      <Button onClick={handleAddContext}>Add Context</Button>
      <p>
        Contexts represent a location where you want to perform tasks, such as 'home, 'work', or
        'grocery store'.
      </p>
      <p>
        Contexts are used to group tasks that are relevant to a specific location. For example, you
        might have a list of tasks to do at home, another list for work, and another list for the
        grocery store.
      </p>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {contexts.map((context) => (
          <ContextSummaryCard key={context} contextName={context} />
        ))}
      </SimpleGrid>

      <Modal opened={opened} onClose={close} size="xs" title="Add Context">
        <NewContextForm onClose={close} />
      </Modal>
    </>
  );
}
