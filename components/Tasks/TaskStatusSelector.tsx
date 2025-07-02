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
  const order = [
    TaskStatus.Started,
    TaskStatus.Waiting,
    TaskStatus.Ready,
    TaskStatus.Done,
    TaskStatus.Cancelled,
  ];

  const handleChange = (selected: TaskStatus[]) => {
    // Sort the selected statuses before passing them to onChange
    const sortedSelected = selected.sort((a, b) => {
      return order.indexOf(a) - order.indexOf(b);
    });
    onChange(sortedSelected);
  };

  return (
    <Chip.Group multiple value={value} onChange={(value) => handleChange(value as TaskStatus[])}>
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
