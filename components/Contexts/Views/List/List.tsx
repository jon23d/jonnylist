import React, { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Modal, Table, Text } from '@mantine/core';
import { useDisclosure, useListState, useResizeObserver } from '@mantine/hooks';
import ListRow from '@/components/Contexts/Views/List/ListRow';
import { ViewProps } from '@/components/Contexts/Views/viewProps';
import TaskEditor from '@/components/Tasks/TaskEditor';
import { useDataSource } from '@/contexts/DataSourceContext';
import { ALL_TASK_STATUSES, Task, TaskStatus } from '@/data/documentTypes/Task';

export default function List({ tasks, visibleStatuses }: ViewProps) {
  const dataSource = useDataSource();

  const [tasksState, handlers] = useListState<Task>(tasks);
  // We are going to tell the rows what the column widths are so that they don't get weird
  // when re-ordering
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [theadRef, theadRect] = useResizeObserver();
  const [editorOpened, { open, close }] = useDisclosure(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    handlers.setState(tasks);
  }, [tasks]);

  // Deal with recording column widths
  useEffect(() => {
    if (theadRef.current && theadRect.width > 0) {
      // Check theadRef.current and ensure it has a width
      const widths: number[] = [];
      const thElements = Array.from(theadRef.current.querySelectorAll('th'));
      thElements.forEach((el) => {
        widths.push((el as HTMLElement).offsetWidth);
      });

      if (widths.length > 0 && JSON.stringify(widths) !== JSON.stringify(columnWidths)) {
        setColumnWidths(widths);
      }
    }
  }, [theadRect.width, tasks.length, columnWidths, theadRef]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    // Initialize groups with empty arrays for all defined statuses
    ALL_TASK_STATUSES.forEach((status) => {
      groups[status] = [];
    });

    // Populate groups with tasks from tasksState
    tasksState
      .filter((task) => visibleStatuses.includes(task.status))
      .forEach((task) => groups[task.status as TaskStatus].push(task));

    // Sort on sortOrder
    Object.keys(groups).forEach((statusKey) => {
      groups[statusKey].sort((a, b) => a.sortOrder - b.sortOrder);
    });

    return groups;
  }, [tasksState, visibleStatuses]);

  if (!tasks.length) {
    return (
      <Text c="dimmed" fs="italic">
        No tasks yet.
      </Text>
    );
  }

  // After dragging a task to a new position, we may need to update its status
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const sourceStatus = result.source.droppableId as TaskStatus;
    const destinationStatus = result.destination.droppableId as TaskStatus;

    // Grab the task from tasksState
    const taskIndex = tasksState.findIndex((task) => task._id === result.draggableId);
    const task = tasksState[taskIndex];

    // Figure out the new sort order based on the destination index
    // First we need to get the task before and after the destination index
    // If the destination and source status are different, finding the tasks is straightforward
    let beforeTask;
    let afterTask;

    if (sourceStatus !== destinationStatus) {
      beforeTask = groupedTasks[destinationStatus][result.destination.index - 1];
      afterTask = groupedTasks[destinationStatus][result.destination.index];
    } else {
      // If the source and destination are the same, then the current task is in the list, and we
      // need to remove it before getting the before and after tasks
      const tasksWithoutCurrent = groupedTasks[destinationStatus].filter((t) => t._id !== task._id);
      beforeTask = tasksWithoutCurrent[result.destination.index - 1];
      afterTask = tasksWithoutCurrent[result.destination.index];
    }

    if (beforeTask && afterTask) {
      task.sortOrder = (beforeTask.sortOrder + afterTask.sortOrder) / 2;
    } else if (beforeTask) {
      // This is the only task in the destination status
      task.sortOrder = beforeTask.sortOrder + 1000;
    } else if (afterTask) {
      // This is now the first task in the destination status
      task.sortOrder = afterTask.sortOrder - 1000;
    } else {
      // This is the only task in the destination status
      task.sortOrder = 5000;
    }

    // Optimistically update the tasks state
    handlers.setItem(taskIndex, { ...task, status: destinationStatus, sortOrder: task.sortOrder });

    // Update the task in the data source
    await dataSource.updateTask({ ...task, status: destinationStatus, sortOrder: task.sortOrder });
  };

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
      <DragDropContext onDragEnd={handleDragEnd}>
        <Table highlightOnHover tabIndex={0}>
          <Table.Thead ref={theadRef}>
            <Table.Tr>
              <Table.Th w={20} />
              <Table.Th>Title</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Due Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          {visibleStatuses.map((status) => (
            <React.Fragment key={status}>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Th
                    colSpan={5}
                    style={{
                      backgroundColor: 'var(--mantine-color-gray-1)',
                      borderBottom: 'none',
                      paddingTop: 'var(--mantine-spacing-xs)',
                    }}
                  >
                    <Text fw={700} c="blue">
                      {status} ({groupedTasks[status].length})
                    </Text>
                  </Table.Th>
                </Table.Tr>
              </Table.Tbody>

              <Droppable droppableId={status}>
                {(provided) => (
                  <Table.Tbody {...provided.droppableProps} ref={provided.innerRef}>
                    {groupedTasks[status].length === 0 ? (
                      <Table.Tr>
                        <Table.Td
                          colSpan={5}
                          style={{
                            fontStyle: 'italic',
                            color: 'var(--mantine-color-gray-6)',
                            textAlign: 'center',
                            borderTop: 'none',
                            paddingBottom: 'var(--mantine-spacing-xs)',
                          }}
                        >
                          No tasks in this status. Drag here to add.
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      groupedTasks[status].map((task, index) => (
                        <ListRow
                          key={task._id}
                          task={task}
                          index={index}
                          columnWidths={columnWidths}
                          handleClick={showEditDialog}
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </Table.Tbody>
                )}
              </Droppable>
            </React.Fragment>
          ))}
        </Table>
      </DragDropContext>
      <Modal opened={editorOpened} onClose={close} title="Edit Task" size="lg">
        {selectedTask && <TaskEditor task={selectedTask} handleClose={cancelEditing} />}
      </Modal>
    </>
  );
}
