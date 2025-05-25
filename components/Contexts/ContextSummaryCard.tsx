import { Paper, Table } from '@mantine/core';

export default function ContextSummaryCard({ contextName }: { contextName: string }) {
  return (
    <Paper shadow="md" withBorder p={20}>
      <h2>{contextName}</h2>
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
  );
}
