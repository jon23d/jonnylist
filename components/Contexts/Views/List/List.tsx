import React, { useEffect, useMemo, useRef, useState } from 'react'; // Use useMemo for grouping logic

import { useRouter } from 'next/router';
import { Table, Text, Title } from '@mantine/core'; // Import Text component for styling
import { ViewProps } from '@/components/Contexts/Views/viewProps';
import { Task } from '@/data/documentTypes/Task';
import classes from './List.module.css';

export default function List({ tasks }: ViewProps) {
  const router = useRouter();
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const focusedRowRef = useRef<HTMLTableRowElement>(null);

  const groupedByStatus = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {};
    }
    return tasks.reduce((acc: { [key: string]: Task[] }, task: Task) => {
      const status: string = task.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
    }, {});
  }, [tasks]);

  // Flatten all tasks into a single array for easier indexing for navigation
  const allTasksFlat = useMemo(() => {
    return Object.values(groupedByStatus).flat();
  }, [groupedByStatus]);

  // Effect to automatically set initial focus to the first task
  useEffect(() => {
    if (allTasksFlat.length > 0 && focusedTaskId === null) {
      setFocusedTaskId(allTasksFlat[0]._id);
    }
  }, [allTasksFlat, focusedTaskId]);

  // Effect to programmatically focus the row when focusedTaskId changes
  useEffect(() => {
    if (focusedRowRef.current) {
      focusedRowRef.current.focus();
    }
  }, [focusedTaskId]);

  const handleTableKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
    if (!focusedTaskId || allTasksFlat.length === 0) {
      return;
    }

    const currentIndex = allTasksFlat.findIndex((task) => task._id === focusedTaskId);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + 1, allTasksFlat.length - 1);
        event.preventDefault(); // Prevent page scroll
        break;
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - 1, 0);
        event.preventDefault();
        break;
      case 'Enter':
        handleRowClick(allTasksFlat[currentIndex]);
        event.preventDefault();
        break;
    }

    if (nextIndex !== currentIndex) {
      setFocusedTaskId(allTasksFlat[nextIndex]._id);
    }
  };

  if (!tasks.length) {
    return (
      <Text c="dimmed" fs="italic">
        No tasks yet.
      </Text>
    );
  }

  const handleRowClick = (task: Task) => {
    setFocusedTaskId(task._id);
    router.push(`/tasks/${task._id}`);
  };

  return (
    <Table highlightOnHover tabIndex={0} onKeyDown={handleTableKeyDown}>
      {/* Table Header - consistent for all groups */}
      <Table.Thead>
        <Table.Tr>
          <Table.Th>ID</Table.Th>
          <Table.Th>Title</Table.Th>
          <Table.Th>Description</Table.Th>
          <Table.Th>Due Date</Table.Th>
        </Table.Tr>
      </Table.Thead>

      {/* Table Body - iterating through groups and their tasks */}
      <Table.Tbody>
        {Object.keys(groupedByStatus).map((status) => (
          // Use a React Fragment to avoid extra DOM elements that might break table structure
          <React.Fragment key={status}>
            {/* Group Header Row */}
            <Table.Tr>
              <Table.Td colSpan={5} style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                <Title order={4} fw={500} my={0}>
                  {status}
                </Title>
              </Table.Td>
            </Table.Tr>

            {/* Task Rows for the current group */}
            {groupedByStatus[status].map((task) => (
              <Table.Tr
                key={task._id}
                ref={task._id === focusedTaskId ? focusedRowRef : null}
                onClick={() => handleRowClick(task)}
                tabIndex={-1}
                role="row"
                aria-selected={focusedTaskId === task._id}
                className={classes.hoverable}
              >
                <Table.Td>{task._id}</Table.Td>
                <Table.Td>{task.title}</Table.Td>
                <Table.Td>{task.description}</Table.Td>
                <Table.Td>
                  {task.dueDate ? task.dueDate.toLocaleDateString() : 'No due date'}
                </Table.Td>
              </Table.Tr>
            ))}
          </React.Fragment>
        ))}
      </Table.Tbody>
    </Table>
  );
}
