import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Badge, Box, Flex, Text } from '@mantine/core';
import { Task, TaskPriority } from '@/data/documentTypes/Task';
import classes from './List.module.css';

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
        <Box
          ref={provided.innerRef}
          onClick={() => handleClick(task)}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          w="100%"
          className={classes.listRow}
        >
          <Box>
            <Flex align="center" gap="sm" style={{ width: '100%' }}>
              {/* Handle - always visible */}
              <div className={classes.dragHandle}>⋮⋮</div>

              {/* Title - takes precedence, always visible */}
              <Text
                fw={500}
                style={{
                  flexShrink: 1,
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {task.title}
              </Text>

              {/* Description - flexible, truncated with ellipses, hidden on small screens */}
              <Text
                c="dimmed"
                flex={1}
                style={{
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                visibleFrom="sm"
              >
                {task.description}
              </Text>

              {/* Metadata - hidden on smallest screens */}
              <Flex gap="xs" align="center" style={{ flexShrink: 0 }} visibleFrom="sm">
                <Text size="xs" c="orange.5" fw={500} style={{ whiteSpace: 'nowrap' }}>
                  {task.dueDate}
                </Text>
                <Box size="xs" c="blue" style={{ whiteSpace: 'nowrap' }}>
                  {task.tags?.map((tag, index) => (
                    <Badge key={index} size="xs" mr={3} variant="light">{`#${tag}`}</Badge>
                  ))}
                </Box>
                <Box size="xs" style={{ whiteSpace: 'nowrap' }}>
                  {priorityBadge(task.priority)}
                </Box>
                <Text size="xs" style={{ whiteSpace: 'nowrap' }}>
                  {task.project ? `${task.project}` : ''}
                </Text>
              </Flex>
            </Flex>
          </Box>
        </Box>
      )}
    </Draggable>
  );
}
