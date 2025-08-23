import { Anchor, Paper, Table, Title } from '@mantine/core';

export default function ProjectsWidget() {
  return (
    <Paper shadow="smw" radius="md" withBorder p="lg">
      <Title order={3}>Projects</Title>
      <Table verticalSpacing="2">
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>Open</Table.Th>
            <Table.Th>Closed</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>No project</Table.Td>
            <Table.Td>11</Table.Td>
            <Table.Td>273</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>
              <Anchor>Project 1</Anchor>
            </Table.Td>
            <Table.Td>5</Table.Td>
            <Table.Td>2</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>
              <Anchor>Project 2</Anchor>
            </Table.Td>
            <Table.Td>3</Table.Td>
            <Table.Td>1</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>
              <Anchor>Project 3</Anchor>
            </Table.Td>
            <Table.Td>8</Table.Td>
            <Table.Td>0</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
