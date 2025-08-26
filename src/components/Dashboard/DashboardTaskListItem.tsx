import React from 'react';
import clsx from 'clsx';
import { Box, Flex } from '@mantine/core';
import StatusChanger from '@/components/Tasks/StatusChanger';
import classes from '@/components/Tasks/Tasks.module.css';
import { Task } from '@/data/documentTypes/Task';

export default function DashboardTaskListItem({
  task,
  handleTaskClick,
  badge,
}: {
  task: any;
  handleTaskClick: (task: Task) => void;
  badge?: React.ReactNode;
}) {
  return (
    <Box key={task._id} p="2" className={clsx(classes.taskListItem, classes.dashboardTasklistItem)}>
      <Flex className={clsx(classes.hasHoverControls)} align="center" p={3}>
        <Box mr={10}>
          <StatusChanger task={task} />
        </Box>
        <Box onClick={() => handleTaskClick(task)} c="black" style={{ cursor: 'pointer' }} flex={1}>
          {task.title}
          {badge}
        </Box>
      </Flex>
    </Box>
  );
}
