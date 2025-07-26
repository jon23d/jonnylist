import React, { useState } from 'react';
import { Badge, Modal, Table, Text } from '@mantine/core';
import { useDisclosure, useViewportSize } from '@mantine/hooks';
import EditTaskForm from '@/components/Tasks/EditTaskForm';
import StatusChanger from '@/components/Tasks/StatusChanger';
import classes from '@/components/Tasks/Tasks.module.css';
import { Task, TaskPriority } from '@/data/documentTypes/Task';
import { getAgeInDays, getUrgency } from '@/helpers/Tasks';

const priorityBadge = (priority?: TaskPriority) => {
  switch (priority) {
    case TaskPriority.Low:
      return <Badge color="gray.4">L</Badge>;
    case TaskPriority.Medium:
      return <Badge color="lime.4">M</Badge>;
    case TaskPriority.High:
      return <Badge color="yellow.5">H</Badge>;
    default:
      return null;
  }
};

export default function TasksTable({
  visibleColumns,
  tasks,
  tasksAreCompletedOrCancelled,
  tasksAreRecurring,
}: {
  visibleColumns: string[];
  tasks: Task[];
  tasksAreCompletedOrCancelled: boolean;
  tasksAreRecurring?: boolean;
}) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editorOpened, { open, close }] = useDisclosure(false);
  const { height: viewportHeight, width: viewportWidth } = useViewportSize();

  const showEditDialog = (task: Task) => {
    setSelectedTask(task);
    open();
  };

  const cancelEditing = () => {
    setSelectedTask(null);
    close();
  };

  if (!tasks.length) {
    return <Text mt={20}>No tasks match current filters</Text>;
  }

  const getRecurrenceText = (task: Task) => {
    if (!task.recurrence) {
      return 'None';
    }

    const { frequency, interval } = task.recurrence;

    if (frequency === 'daily') {
      if (interval === 1) {
        return 'Daily';
      }
      return `Every ${interval} days`;
    }

    if (frequency === 'weekly') {
      const dayOfWeek = task.recurrence.dayOfWeek;
      const dayString =
        dayOfWeek !== undefined
          ? `on ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]}`
          : '';
      const inflection = interval === 1 ? 'week' : `${interval} weeks`;
      return `Every ${inflection} ${dayString}`;
    }

    if (frequency === 'monthly') {
      const dayOfMonth = task.recurrence.dayOfMonth;
      if (dayOfMonth !== undefined) {
        return `Every ${interval} month(s) on the ${dayOfMonth}${dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th'}`;
      }
      return `Every ${interval} month(s)`;
    }

    if (frequency === 'yearly') {
      const firstOccurrence = task.recurrence.yearlyFirstOccurrence;
      if (firstOccurrence) {
        return `Every ${interval} year(s) starting from ${new Date(firstOccurrence).toLocaleDateString()}`;
      }
      return `Every ${interval} year(s)`;
    }
  };

  return (
    <>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {visibleColumns.includes('Active') ? <Table.Th w="25px" /> : null}
            {tasksAreRecurring ? <Table.Th>Recurrence</Table.Th> : null}
            <Table.Th>Title</Table.Th>
            {visibleColumns.includes('Description') ? <Table.Th>Description</Table.Th> : null}
            {visibleColumns.includes('Tags') ? <Table.Th>Tags</Table.Th> : null}
            {visibleColumns.includes('Project') ? <Table.Th>Project</Table.Th> : null}
            {visibleColumns.includes('Priority') ? <Table.Th>Priority</Table.Th> : null}
            {visibleColumns.includes('Due Date') ? <Table.Th>Due</Table.Th> : null}
            {visibleColumns.includes('Age') ? <Table.Th>Age</Table.Th> : null}
            {visibleColumns.includes('Urgency') ? <Table.Th>Urgency</Table.Th> : null}
            {tasksAreCompletedOrCancelled ? <Table.Th>Completed</Table.Th> : null}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tasks.map((task) => (
            <Table.Tr key={task._id} className={classes.hasHoverControls}>
              {visibleColumns.includes('Active') ? (
                <Table.Td>
                  <StatusChanger task={task} />
                </Table.Td>
              ) : null}
              {tasksAreRecurring ? (
                <Table.Td onClick={() => showEditDialog(task)}>{getRecurrenceText(task)}</Table.Td>
              ) : null}
              <Table.Td onClick={() => showEditDialog(task)}>{task.title}</Table.Td>
              {visibleColumns.includes('Description') ? (
                <Table.Td onClick={() => showEditDialog(task)}>{task.description}</Table.Td>
              ) : null}
              {visibleColumns.includes('Tags') ? (
                <Table.Td onClick={() => showEditDialog(task)}>
                  {task.tags?.map((tag, index) => (
                    <Badge key={index} size="xs" mr={3} variant="light">{`#${tag}`}</Badge>
                  ))}
                </Table.Td>
              ) : null}
              {visibleColumns.includes('Project') ? (
                <Table.Td onClick={() => showEditDialog(task)}>{task.project}</Table.Td>
              ) : null}
              {visibleColumns.includes('Priority') ? (
                <Table.Td onClick={() => showEditDialog(task)}>
                  {priorityBadge(task.priority)}
                </Table.Td>
              ) : null}
              {visibleColumns.includes('Due Date') ? (
                <Table.Td c="orange.5" onClick={() => showEditDialog(task)}>
                  {task.dueDate}
                </Table.Td>
              ) : null}
              {visibleColumns.includes('Age') ? (
                <Table.Td onClick={() => showEditDialog(task)}>
                  {getAgeInDays(task.createdAt)}
                </Table.Td>
              ) : null}
              {visibleColumns.includes('Urgency') ? <Table.Td>{getUrgency(task)}</Table.Td> : null}
              {tasksAreCompletedOrCancelled ? (
                <Table.Td onClick={() => showEditDialog(task)}>
                  {task.updatedAt.toLocaleDateString()}
                </Table.Td>
              ) : null}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={editorOpened}
        onClose={close}
        title="Edit Task"
        size="lg"
        fullScreen={viewportWidth < 768 || viewportHeight < 500}
      >
        {selectedTask && <EditTaskForm task={selectedTask} handleClose={cancelEditing} />}
      </Modal>
    </>
  );
}
