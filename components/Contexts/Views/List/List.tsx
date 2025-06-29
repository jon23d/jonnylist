import React, { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Box, Modal, Text } from '@mantine/core';
import { useDisclosure, useListState } from '@mantine/hooks';
import ListRow from '@/components/Contexts/Views/List/ListRow';
import { ViewProps } from '@/components/Contexts/Views/viewProps';
import TaskEditor from '@/components/Tasks/TaskEditor';
import { useDataSource } from '@/contexts/DataSourceContext';
import { ALL_TASK_STATUSES, sortedTasks, Task, TaskStatus } from '@/data/documentTypes/Task';
import { generateKeyBetween } from '@/helpers/fractionalIndexing';

export default function List({ tasks, visibleStatuses }: ViewProps) {
  const dataSource = useDataSource();

  const [tasksState, handlers] = useListState<Task>(tasks);
  const [editorOpened, { open, close }] = useDisclosure(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    handlers.setState(tasks);
  }, [tasks]);

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
      groups[statusKey] = sortedTasks(groups[statusKey]);
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

    task.sortOrder = generateKeyBetween(beforeTask?.sortOrder, afterTask?.sortOrder);

    // Optimistically update the tasks states
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
        {visibleStatuses.map((status) => (
          <React.Fragment key={status}>
            <Box
              style={{
                backgroundColor: 'var(--mantine-color-gray-1)',
                borderBottom: 'none',
                paddingTop: 'var(--mantine-spacing-xs)',
              }}
            >
              <Text fw={700} c="blue">
                {status} ({groupedTasks[status].length})
              </Text>
            </Box>

            <Droppable droppableId={status}>
              {(provided) => (
                <Box {...provided.droppableProps} ref={provided.innerRef}>
                  {groupedTasks[status].length === 0 ? (
                    <Box
                      style={{
                        fontStyle: 'italic',
                        color: 'var(--mantine-color-gray-6)',
                        textAlign: 'center',
                        borderTop: 'none',
                        paddingBottom: 'var(--mantine-spacing-xs)',
                      }}
                    >
                      No tasks in this status. Drag here to add.
                    </Box>
                  ) : (
                    groupedTasks[status].map((task, index) => (
                      <ListRow
                        key={task._id}
                        task={task}
                        index={index}
                        handleClick={showEditDialog}
                      />
                    ))
                  )}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </React.Fragment>
        ))}
      </DragDropContext>
      <Modal opened={editorOpened} onClose={close} title="Edit Task" size="lg">
        {selectedTask && <TaskEditor task={selectedTask} handleClose={cancelEditing} />}
      </Modal>
    </>
  );
}
