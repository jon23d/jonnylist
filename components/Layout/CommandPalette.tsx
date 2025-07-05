import React, { useEffect, useMemo, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Spotlight, SpotlightActionData, SpotlightActionGroupData } from '@mantine/spotlight';
import EditTaskForm from '@/components/Tasks/EditTaskForm';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';

export default function CommandPalette() {
  const taskRepository = useTaskRepository();
  const [openTasks, setOpenTasks] = useState<Task[]>([]);
  const [taskOpened, { open, close }] = useDisclosure(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const cancelEditing = () => {
    setSelectedTask(null);
    close();
  };

  const actions = useMemo(() => {
    const actionsArray: (SpotlightActionGroupData | SpotlightActionData)[] = [];

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
  }, [openTasks]);

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
      <Modal opened={taskOpened} onClose={close} title="Edit Task" size="lg">
        {selectedTask && <EditTaskForm task={selectedTask} handleClose={cancelEditing} />}
      </Modal>
    </>
  );
}
