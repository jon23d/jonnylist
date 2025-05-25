import { Paper, Table } from '@mantine/core';

export default function ListSummaryCard({ listName }: { listName: string }) {
  return (
    <Paper shadow="md" withBorder p={20}>
      <h2>{listName}</h2>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Item</Table.Th>
            <Table.Th>Quantity</Table.Th>
            <Table.Th>Notes</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>Apples</Table.Td>
            <Table.Td>5</Table.Td>
            <Table.Td>Granny Smith</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Bananas</Table.Td>
            <Table.Td>3</Table.Td>
            <Table.Td>Ripe</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>Oranges</Table.Td>
            <Table.Td>4</Table.Td>
            <Table.Td>Navel</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
