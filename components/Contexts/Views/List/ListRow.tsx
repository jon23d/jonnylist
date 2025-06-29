import React, { ReactElement } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { IconGripVertical } from '@tabler/icons-react';
import { Box, Flex, Text } from '@mantine/core';
import { Task } from '@/data/documentTypes/Task';
import classes from './List.module.css';

const rightSideTokens = (task: Task): ReactElement => {
  const tokens = [];

  if (task.priority !== 1) {
    tokens.push(`[${task.priority}]`);
  }
  if (task.dueDate) {
    tokens.push(`(${task.dueDate})`);
  }

  return (
    <Box style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
      <Text c="dimmed" ml={10}>
        {tokens.join(' ')}
      </Text>{' '}
      {/* Added margin to separate from description */}
    </Box>
  );
};

const centerTokens = (task: Task): ReactElement => {
  if (!task.description) {
    return (
      <Box style={{ minWidth: 0 }}>
        {' '}
        {/* Ensure Box can shrink */}
        <Text style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {task.title}
        </Text>
      </Box>
    );
  }

  return (
    <Flex
      align="center"
      justify="flex-start"
      // Crucial: The parent Flex must be able to shrink to allow its children to be constrained.
      // Use nowrap to prevent inner elements from wrapping and minWidth: 0 for proper shrinking.
      style={{ flexWrap: 'nowrap', minWidth: 0 }}
    >
      {/* Title: Prioritized, no wrap, no shrink */}
      <Text style={{ whiteSpace: 'nowrap', flexShrink: 0, minWidth: 0 }}>{task.title}</Text>

      {/* Description: Takes remaining space and truncates. Must have minWidth: 0. */}
      <Text c="dimmed" ml={5} truncate="end" style={{ flexGrow: 1, minWidth: 0 }}>
        {task.description}
      </Text>
    </Flex>
  );
};

export default function ListRow({
  task,
  index,
  handleClick,
}: {
  task: Task;
  index: number;
  handleClick: (task: Task) => void;
}) {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided) => (
        <Flex
          ref={provided.innerRef}
          onClick={() => handleClick(task)}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          w="100%"
          align="center"
          className={classes.listRow}
        >
          <Box className={classes.dragHandle}>
            <IconGripVertical size={18} stroke={1.5} />
          </Box>
          <Box flex={1}>{centerTokens(task)}</Box>
          <Box style={{ flexShrink: 0 }}>{rightSideTokens(task)}</Box>
        </Flex>
      )}
    </Draggable>
  );
}
