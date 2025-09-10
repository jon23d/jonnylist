import React, { useEffect, useMemo, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@mantine/core';
import { useDisclosure, useViewportSize } from '@mantine/hooks';
import { Spotlight, SpotlightActionData, SpotlightActionGroupData } from '@mantine/spotlight';
import NewTaskForm from '@/components/Layout/NewItem/NewTaskForm';
import EditTaskForm from '@/components/Tasks/EditTaskForm';
import { useContextRepository, useTaskRepository } from '@/contexts/DataSourceContext';
import { Context } from '@/data/documentTypes/Context';
import { Task, TaskStatus } from '@/data/documentTypes/Task';

export default function CommandPalette() {
  const taskRepository = useTaskRepository();
  const contextRepository = useContextRepository();
  const [openTasks, setOpenTasks] = useState<Task[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [taskOpened, { open, close }] = useDisclosure(false);
  const [newTaskOpened, { open: openNewTask, close: closeNewTask }] = useDisclosure(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { height: viewportHeight, width: viewportWidth } = useViewportSize();
  const navigate = useNavigate();

  const cancelEditing = () => {
    setSelectedTask(null);
    close();
  };

  const actions = useMemo(() => {
    const actionsArray: (SpotlightActionGroupData | SpotlightActionData)[] = [];

    // New task action
    const newTaskAction: SpotlightActionData = {
      id: 'new-task',
      label: 'Add New Task',
      description: 'Create a new task',
      onClick: () => {
        setSelectedTask(null);
        openNewTask();
      },
    };
    actionsArray.push(newTaskAction);

    // Context actions
    const contextActions = contexts.map((context) => ({
      id: `context-${context._id}`,
      label: context.name,
      onClick: () => {
        navigate(`/tasks?context=${context._id}`);
      },
    }));
    if (contextActions.length > 0) {
      actionsArray.push({
        group: 'Contexts',
        actions: contextActions,
      });
    }

    // Open tasks actions
    const openTaskActions = openTasks.map((task) => ({
      id: `task-${task._id}`,
      label: task.title,
      description: task.description,
      onClick: () => {
        setSelectedTask(task);
        open();
      },
    }));

    if (openTaskActions.length > 0) {
      actionsArray.push({
        group: `Tasks`,
        actions: openTaskActions,
      });
    }

    return actionsArray;
  }, [openTasks, contexts]);

  // Subscribe to open tasks
  useEffect(() => {
    const unsubscribe = taskRepository.subscribeToTasks(
      {
        statuses: [TaskStatus.Started, TaskStatus.Waiting, TaskStatus.Ready],
      },
      setOpenTasks
    );

    return unsubscribe;
  }, []);

  // Subscribe to contexts
  useEffect(() => {
    const unsubscribe = contextRepository.subscribeToContexts(setContexts);

    return unsubscribe;
  }, []);

  return (
    <>
      <Spotlight
        actions={actions}
        nothingFound="Nothing found..."
        highlightQuery
        searchProps={{
          leftSection: <IconSearch size={20} stroke={1.5} />,
          placeholder: 'Search...',
        }}
      />
      {taskOpened && (
        <Modal opened={taskOpened} onClose={close} title="Edit Task" size="lg">
          {selectedTask && <EditTaskForm task={selectedTask} handleClose={cancelEditing} />}
        </Modal>
      )}
      {newTaskOpened && (
        <Modal
          opened={newTaskOpened}
          onClose={closeNewTask}
          title="Add Task"
          size="lg"
          fullScreen={viewportWidth < 768 || viewportHeight < 500}
        >
          <NewTaskForm handleClose={closeNewTask} />
        </Modal>
      )}
    </>
  );
}
