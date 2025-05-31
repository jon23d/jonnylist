import React from 'react';
import { Chip, Group } from '@mantine/core';
import { TaskStatus } from '@/data/DataSource';

export default function TaskStatusSelector({
  value,
  onChange,
}: {
  value: TaskStatus[];
  onChange: (selectedStatuses: TaskStatus[]) => void;
}) {
  return (
    <Chip.Group multiple value={value} onChange={(value) => onChange(value as TaskStatus[])}>
      <Group gap="xs">
        <Chip value={TaskStatus.Ready} size="xs">
          Ready
        </Chip>
        <Chip value={TaskStatus.Started} size="xs">
          Started
        </Chip>
        <Chip value={TaskStatus.Completed} size="xs">
          Completed
        </Chip>
        <Chip value={TaskStatus.Cancelled} size="xs">
          Cancelled
        </Chip>
        <Chip value={TaskStatus.Waiting} size="xs">
          Waiting
        </Chip>
      </Group>
    </Chip.Group>
  );
}
