import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { IconGripVertical } from '@tabler/icons-react';
import { Table } from '@mantine/core';
import { Task } from '@/data/documentTypes/Task';
import classes from './List.module.css';

export default function ListRow({
  task,
  index,
  columnWidths,
  handleClick,
}: {
  task: Task;
  index: number;
  columnWidths: number[];
  handleClick: (task: Task) => void;
}) {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided) => (
        <Table.Tr
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={classes.hoverable}
          onClick={() => handleClick(task)}
        >
          <Table.Td w={columnWidths[0]}>
            <div className={classes.dragHandle} {...provided.dragHandleProps}>
              <IconGripVertical size={18} stroke={1.5} />
            </div>
          </Table.Td>
          <Table.Td w={columnWidths[1]}>{task.title}</Table.Td>
          <Table.Td w={columnWidths[2]}>{task.description}</Table.Td>
          <Table.Td w={columnWidths[3]}>{task.dueDate ? task.dueDate : 'No due date'}</Table.Td>
        </Table.Tr>
      )}
    </Draggable>
  );
}
