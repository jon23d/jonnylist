import React, { useEffect, useRef, useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Modal, Table, Text } from '@mantine/core';
import { useDisclosure, useListState } from '@mantine/hooks';
import ListRow from '@/components/Contexts/Views/List/ListRow';
import { ViewProps } from '@/components/Contexts/Views/viewProps';
import TaskEditor from '@/components/Tasks/TaskEditor';
import { Task } from '@/data/documentTypes/Task';

export default function List({ tasks }: ViewProps) {
  const [tasksState, handlers] = useListState<Task>(tasks);
  // We are going to tell the rows what the column widths are so that they don't get weird
  // when re-ordering
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const [editorOpened, { open, close }] = useDisclosure(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // We need to support re-ordering of tasks in the list.
  useEffect(() => {
    handlers.setState(tasks);
  }, [tasks]);

  useEffect(() => {
    const measureWidths = () => {
      if (theadRef.current) {
        const widths: number[] = [];
        const thElements = Array.from(theadRef.current.querySelectorAll('th'));
        thElements.forEach((el) => {
          widths.push(el.offsetWidth);
        });

        if (widths.length > 0 && JSON.stringify(widths) !== JSON.stringify(columnWidths)) {
          setColumnWidths(widths);
        }
      }
    };
    measureWidths();

    window.addEventListener('resize', measureWidths);
    return () => {
      window.removeEventListener('resize', measureWidths);
    };
  }, [tasks.length]);

  if (!tasks.length) {
    return (
      <Text c="dimmed" fs="italic">
        No tasks yet.
      </Text>
    );
  }

  const showEditDialog = (task: Task) => {
    setSelectedTask(task);
    open();
  };

  const cancelEditing = () => {
    setSelectedTask(null);
    close();
  };

  return (
    <>
      <DragDropContext
        onDragEnd={({ destination, source }) =>
          handlers.reorder({ from: source.index, to: destination?.index || 0 })
        }
      >
        <Table highlightOnHover tabIndex={0}>
          <Table.Thead ref={theadRef}>
            <Table.Tr>
              <Table.Th w={40} />
              <Table.Th>Title</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Due Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Droppable droppableId="dnd-list">
            {(provided) => (
              <Table.Tbody {...provided.droppableProps} ref={provided.innerRef}>
                {tasksState.map((task, index) => (
                  <ListRow
                    key={task._id}
                    task={task}
                    index={index}
                    columnWidths={columnWidths}
                    handleClick={showEditDialog}
                  />
                ))}
                {provided.placeholder}
              </Table.Tbody>
            )}
          </Droppable>
        </Table>
      </DragDropContext>
      <Modal opened={editorOpened} onClose={close} title="Edit Task" size="lg">
        {selectedTask && <TaskEditor task={selectedTask} handleClose={cancelEditing} />}
      </Modal>
    </>
  );
}
