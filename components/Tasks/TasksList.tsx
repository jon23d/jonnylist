import React, { useState } from 'react';
import clsx from 'clsx';
import { Badge, Box, Group, Modal, Paper, Stack, Text } from '@mantine/core';
import { useDisclosure, useViewportSize } from '@mantine/hooks';
import EditTaskForm from '@/components/Tasks/EditTaskForm';
import StatusChanger from '@/components/Tasks/StatusChanger';
import classes from '@/components/Tasks/Tasks.module.css';
import { Task, TaskPriority } from '@/data/documentTypes/Task';

const priorityBadge = (priority?: TaskPriority) => {
  const badges = {
    [TaskPriority.Low]: { color: 'gray.4', label: 'L' },
    [TaskPriority.Medium]: { color: 'lime.4', label: 'M' },
    [TaskPriority.High]: { color: 'yellow.5', label: 'H' },
  };

  const badge = badges[priority as TaskPriority];
  return badge ? (
    <Badge color={badge.color} size="sm">
      {badge.label}
    </Badge>
  ) : null;
};

export default function TasksList({ tasks }: { tasks: Task[] }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editorOpened, { open, close }] = useDisclosure(false);
  const { height: viewportHeight, width: viewportWidth } = useViewportSize();

  const cancelEditing = () => {
    setSelectedTask(null);
    close();
  };

  if (!tasks.length) {
    return <Text mt={20}>No tasks match current filters</Text>;
  }

  const secondRowItems = (task: Task) => {
    const items = [<StatusChanger key="statuschanger" task={task} />];

    if (task.project) {
      items.push(
        <Text key="project" c="dimmed" size="sm">
          {task.project}
        </Text>
      );
    }

    if (task.priority) {
      items.push(<Box key="priority">{priorityBadge(task.priority)}</Box>);
    }

    if (task.dueDate) {
      items.push(
        <Text key="dueDate" c="orange.5">
          {task.dueDate}
        </Text>
      );
    }

    if (task.tags && task.tags.length > 0) {
      items.push(
        <Box key="tags">
          {task.tags.map((tag, index) => (
            <Badge key={index} size="xs" mr={3} variant="light">{`#${tag}`}</Badge>
          ))}
        </Box>
      );
    }

    return items;
  };

  const showEditDialog = (task: Task) => {
    setSelectedTask(task);
    open();
  };

  return (
    <Stack mt={30} gap="xs">
      {tasks.map((task) => (
        <Paper
          shadow="md"
          p="sm"
          key={task._id}
          className={clsx(classes.hasHoverControls, classes.taskListItem)}
          onClick={() => showEditDialog(task)}
        >
          <Stack gap="0.25em">
            <Text>{task.title}</Text>

            <Group justify="flex-start">{secondRowItems(task).map((item) => item)}</Group>

            <Text size="sm" c="dimmed" ml={38}>
              {task.description}
            </Text>
          </Stack>
        </Paper>
      ))}

      <Modal
        opened={editorOpened}
        onClose={close}
        title="Edit Task"
        size="lg"
        fullScreen={viewportWidth < 768 || viewportHeight < 500}
      >
        {selectedTask && <EditTaskForm task={selectedTask} handleClose={cancelEditing} />}
      </Modal>
    </Stack>
  );
}
