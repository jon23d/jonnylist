import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { IconManualGearboxFilled, IconSearch, IconSettings } from '@tabler/icons-react';
import { Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Spotlight, SpotlightActionData, SpotlightActionGroupData } from '@mantine/spotlight';
import TaskEditor from '@/components/Tasks/TaskEditor';
import { useDataSource, useTaskRepository } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';

export default function CommandPalette() {
  const router = useRouter();
  const dataSource = useDataSource();
  const taskRepository = useTaskRepository();
  const [contexts, setContexts] = useState<string[]>([]);
  const [openTasks, setOpenTasks] = useState<Task[]>([]);
  const [taskOpened, { open, close }] = useDisclosure(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const cancelEditing = () => {
    setSelectedTask(null);
    close();
  };

  const actions = useMemo(() => {
    const actionsArray: (SpotlightActionGroupData | SpotlightActionData)[] = [
      {
        id: 'settings',
        label: 'Settings',
        description: 'Open settings',
        onClick: () => router.push('/settings'),
        leftSection: <IconSettings size={24} stroke={1.5} />,
      },
    ];

    // Contexts actions
    const contextActions = contexts.map((context) => ({
      id: `context-${context}`,
      label: context,
      description: `View context: ${context}`,
      onClick: () => router.push(`/contexts/view?name=${context}`),
      leftSection: <IconManualGearboxFilled size={24} stroke={1.5} />,
    }));

    if (contextActions.length > 0) {
      actionsArray.push({
        group: `Contexts`,
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
  }, [contexts, openTasks]);

  // Subscribe to contexts
  useEffect(() => {
    const unsubscribe = dataSource.subscribeToContexts(setContexts);

    return () => {
      unsubscribe();
    };
  }, [dataSource]);

  // Subscribe to open tasks
  useEffect(() => {
    const unsubscribe = taskRepository.subscribeToTasks(
      {
        statuses: [TaskStatus.Started, TaskStatus.Waiting, TaskStatus.Ready],
      },
      setOpenTasks
    );

    return () => {
      unsubscribe();
    };
  }, [dataSource]);

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
      <Modal opened={taskOpened} onClose={close} title="Edit Task" size="lg">
        {selectedTask && <TaskEditor task={selectedTask} handleClose={cancelEditing} />}
      </Modal>
    </>
  );
}
