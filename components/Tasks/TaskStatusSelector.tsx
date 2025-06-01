import React from 'react';
import { Chip, Group } from '@mantine/core';
import { TaskStatus, taskStatusSelectOptions } from '@/data/documentTypes/Task';

export default function TaskStatusSelector({
  value,
  onChange,
}: {
  value: TaskStatus[];
  onChange: (selectedStatuses: TaskStatus[]) => void;
}) {
  return (
    <Chip.Group multiple value={value} onChange={(value) => onChange(value as TaskStatus[])}>
      <Group gap="3px">
        {taskStatusSelectOptions.map((option) => (
          <Chip key={option.value} value={option.value} size="xs">
            {option.label}
          </Chip>
        ))}
      </Group>
    </Chip.Group>
  );
}
