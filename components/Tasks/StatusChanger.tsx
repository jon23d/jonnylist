import React from 'react';
import { Box, Menu, UnstyledButton } from '@mantine/core';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import classes from './Tasks.module.css';

export default function StatusChanger({ task }: { task: Task }) {
  const taskRepository = useTaskRepository();

  const configuration: {
    icon: React.ReactNode | null;
    alwaysVisible: boolean;
  } = {
    icon: null,
    alwaysVisible: false,
  };

  const handleStart = async () => {
    await taskRepository.updateTask({
      ...task,
      status: TaskStatus.Started,
    });
  };

  const handleComplete = async () => {
    await taskRepository.updateTask({
      ...task,
      status: TaskStatus.Done,
    });
  };

  const handleStop = async () => {
    await taskRepository.updateTask({
      ...task,
      status: TaskStatus.Ready,
    });
  };

  if (task.status === TaskStatus.Started) {
    configuration.icon = (
      <Menu shadow="xs">
        <Menu.Target>
          <UnstyledButton>⏳</UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item onClick={handleStop}>Stop</Menu.Item>
          <Menu.Item onClick={handleComplete}>Complete</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
    configuration.alwaysVisible = true;
  }

  if (task.status === TaskStatus.Ready) {
    configuration.icon = <UnstyledButton onClick={handleStart}>▶️</UnstyledButton>;
  }

  if (!configuration.icon) {
    return <></>;
  }

  const className = configuration.alwaysVisible ? '' : classes.hidden;

  return <Box className={`${className} ${classes.statusChangerButton}`}>{configuration.icon}</Box>;
}
