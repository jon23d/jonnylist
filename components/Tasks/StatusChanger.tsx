import React from 'react';
import { IconClockPlay } from '@tabler/icons-react';
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

  const updateTaskStatus = async (status: TaskStatus) => {
    await taskRepository.updateTask({ ...task, status });
  };

  const handleStart = () => updateTaskStatus(TaskStatus.Started);
  const handleComplete = () => updateTaskStatus(TaskStatus.Done);
  const handleCancel = () => updateTaskStatus(TaskStatus.Cancelled);
  const handleStop = () => updateTaskStatus(TaskStatus.Ready);

  if (task.status === TaskStatus.Started) {
    configuration.icon = (
      <Box onClick={(e) => e.stopPropagation()}>
        <Menu shadow="xs">
          <Menu.Target>
            <UnstyledButton aria-label="Change task status">
              <Box mt={3} mb={-3}>
                <IconClockPlay color="green" size={16} />
              </Box>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Change status</Menu.Label>
            <Menu.Item onClick={handleStop}>Ready</Menu.Item>
            <Menu.Divider />
            <Menu.Item onClick={handleComplete}>Complete</Menu.Item>
            <Menu.Item onClick={handleCancel}>Cancel</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    );
    configuration.alwaysVisible = true;
  }

  if (task.status === TaskStatus.Ready) {
    configuration.icon = (
      <Box onClick={(e) => e.stopPropagation()}>
        <Menu shadow="xs">
          <Menu.Target>
            <UnstyledButton aria-label="Change task status">⋮⋮</UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Change status</Menu.Label>
            <Menu.Item onClick={handleStart}>Start</Menu.Item>
            <Menu.Divider />
            <Menu.Item onClick={handleComplete}>Complete</Menu.Item>
            <Menu.Item onClick={handleCancel}>Cancel</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    );
  }

  if (!configuration.icon) {
    return <></>;
  }

  const className = configuration.alwaysVisible ? '' : classes.hidden;

  return <Box className={`${className} ${classes.statusChangerButton}`}>{configuration.icon}</Box>;
}
