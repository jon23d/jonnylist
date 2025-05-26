import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Button, FocusTrap, Modal, SimpleGrid, Stack, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import ContextSummaryCard from '@/components/Contexts/ContextSummaryCard';
import { useDataSource } from '@/contexts/DataSourceContext';

export default function Page() {
  const dataSource = useDataSource();
  const [contexts, setContexts] = useState<string[]>([]);
  const [opened, { open, close }] = useDisclosure(false);

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

  useEffect(() => {
    const fetchData = async () => {
      return await dataSource.getContexts();
    };
    fetchData().then(setContexts);
  }, []);

  const handleAddContext = () => {
    open();
  };

  const handleCloseModal = () => {
    form.reset();
    close();
  };

  const saveContext = async () => {
    const newContextName = form.getTransformedValues().newContextName;
    await dataSource.addContext(newContextName);
    setContexts((prev) => [...prev, newContextName]);
    handleCloseModal();
  };

  return (
    <>
      <Head>
        <title>Contexts | JonnyList</title>
      </Head>

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
        <FocusTrap>
          <Stack gap="md">
            <form onSubmit={form.onSubmit(saveContext)}>
              <TextInput
                label="Context name"
                placeholder="e.g. Home, Work"
                withAsterisk
                data-autofocus
                {...form.getInputProps('newContextName')}
              />
              <Button type="submit">Save</Button>
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
            </form>
          </Stack>
        </FocusTrap>
      </Modal>
    </>
  );
}
