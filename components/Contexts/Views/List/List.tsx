import { Table } from '@mantine/core';
import { ViewProps } from '@/components/Contexts/Views/viewProps';

export default function List(viewProps: ViewProps) {
  return (
    <>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Due Date</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {viewProps.tasks.map((task) => (
            <Table.Tr key={task._id}>
              <Table.Td>{task._id}</Table.Td>
              <Table.Td>{task.title}</Table.Td>
              <Table.Td>{task.description}</Table.Td>
              <Table.Td>{task.status}</Table.Td>
              <Table.Td>
                {task.dueDate ? task.dueDate.toLocaleDateString() : 'No due date'}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
}
