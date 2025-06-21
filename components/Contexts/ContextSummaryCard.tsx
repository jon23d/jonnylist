import { lazy, Suspense } from 'react';
import { IconSettings } from '@tabler/icons-react';
import { Flex, Modal, Paper, Table, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

const LazyModal = lazy(() => import('./Settings/Settings'));

export default function ContextSummaryCard({ contextName }: { contextName: string }) {
  const [opened, { open, close }] = useDisclosure(false);

  const handleClickSettings = () => {
    open();
  };

  return (
    <>
      <Paper shadow="md" withBorder p={20}>
        <Flex justify="space-between" align="center">
          <Title order={3}>{contextName}</Title>
          <Tooltip label="Settings" withArrow>
            <IconSettings size={17} color="gray" onClick={handleClickSettings} cursor="pointer" />
          </Tooltip>
        </Flex>

        <Table variant="vertical">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Open</Table.Th>
              <Table.Td>11</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Completed</Table.Th>
              <Table.Td>5</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Overdue</Table.Th>
              <Table.Td>2</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Projects</Table.Th>
              <Table.Td>3</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Th>Time spent</Table.Th>
              <Table.Td>2h 30m</Table.Td>
            </Table.Tr>
          </Table.Thead>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={`${contextName} Settings`}>
        <Suspense fallback={<div>Loading...</div>}>
          <LazyModal contextName={contextName} onClose={close} />
        </Suspense>
      </Modal>
    </>
  );
}
