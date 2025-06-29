import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { IconGripVertical } from '@tabler/icons-react';
import { Flex } from '@mantine/core';
import { Task } from '@/data/documentTypes/Task';
import classes from './List.module.css';

/**
 * Tasks will look like this:
 *
 * [Priority] (due date) Title - Description
 * @param task
 */
const taskRow = (task: Task) => {
  const priority = task.priority !== 1 ? `[${task.priority}]` : '';
  const dueDate = task.dueDate ? `(${task.dueDate})` : '';
  const description = task.description ? ` - ${task.description}` : '';

  return `${priority} ${dueDate} ${task.title}${description}`;
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
          {...provided.draggableProps}
          className={classes.hoverable}
          onClick={() => handleClick(task)}
          {...provided.dragHandleProps}
        >
          <div className={classes.dragHandle}>
            <IconGripVertical size={18} stroke={1.5} />
          </div>

          <div>{taskRow(task)}</div>
        </Flex>
      )}
    </Draggable>
  );
}
