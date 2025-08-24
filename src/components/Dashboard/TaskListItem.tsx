import React from 'react';
import clsx from 'clsx';
import { Box, Flex, List } from '@mantine/core';
import StatusChanger from '@/components/Tasks/StatusChanger';
import classes from '@/components/Tasks/Tasks.module.css';
import { Task } from '@/data/documentTypes/Task';

export default function TaskListItem({
  task,
  isEvenRow,
  handleTaskClick,
  badge,
}: {
  task: any;
  isEvenRow: boolean;
  handleTaskClick: (task: Task) => void;
  badge?: React.ReactNode;
}) {
  return (
    <List.Item
      key={task._id}
      bg={isEvenRow ? 'gray.0' : ''}
      p="2"
      className={clsx(classes.taskListItem, classes.dashboardTasklistItem)}
    >
      <Flex className={clsx(classes.hasHoverControls)} align="center" p={3}>
        <Box mr={10}>
          <StatusChanger task={task} />
        </Box>
        <Box onClick={() => handleTaskClick(task)} c="black" style={{ cursor: 'pointer' }}>
          {task.title}
          {badge}
        </Box>
      </Flex>
    </List.Item>
  );
}
