import React from 'react';
import clsx from 'clsx';
import { Anchor, Box, Flex, List } from '@mantine/core';
import StatusChanger from '@/components/Tasks/StatusChanger';
import classes from '@/components/Tasks/Tasks.module.css';

export default function TaskListItem({
  task,
  isEvenRow,
  badge,
}: {
  task: any;
  isEvenRow: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <List.Item key={task._id} bg={isEvenRow ? 'gray.0' : ''} p="2" mb={3}>
      <Flex className={clsx(classes.hasHoverControls)} align="center" pl={3}>
        <Box mr={10} mt="6">
          <StatusChanger task={task} />
        </Box>
        <Anchor href="#" size="sm">
          {task.title}
          {badge}
        </Anchor>
      </Flex>
    </List.Item>
  );
}
