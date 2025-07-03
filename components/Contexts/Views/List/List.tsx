import React, { useEffect, useMemo, useState } from 'react';
import { Box, Modal, Text } from '@mantine/core';
import { useDisclosure, useListState } from '@mantine/hooks';
import ListRow from '@/components/Contexts/Views/List/ListRow';
import { ViewProps } from '@/components/Contexts/Views/viewProps';
import TaskEditor from '@/components/Tasks/TaskEditor';
import { ALL_TASK_STATUSES, Task, TaskStatus } from '@/data/documentTypes/Task';
import classes from './List.module.css';

export default function List({ tasks, visibleStatuses }: ViewProps) {
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

    return groups;
  }, [tasksState, visibleStatuses]);

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
      {visibleStatuses.map((status) => (
        <React.Fragment key={status}>
          <Box className={classes.statusHeader} p={10}>
            <Text fw={700} c="blue">
              {status} ({groupedTasks[status].length})
            </Text>
          </Box>

          <Box>
            {groupedTasks[status].length === 0 ? (
              <Box className={classes.emptyList}>No tasks in this status</Box>
            ) : (
              groupedTasks[status].map((task) => (
                <div className={classes.listItemContainer} key={task._id}>
                  <ListRow task={task} handleClick={showEditDialog} />
                </div>
              ))
            )}
          </Box>
        </React.Fragment>
      ))}

      <Modal opened={editorOpened} onClose={close} title="Edit Task" size="lg">
        {selectedTask && <TaskEditor task={selectedTask} handleClose={cancelEditing} />}
      </Modal>
    </>
  );
}
