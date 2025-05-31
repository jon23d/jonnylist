import React from 'react';
import { IconCalendarFilled, IconLayoutKanbanFilled, IconList } from '@tabler/icons-react';
import { Center, SegmentedControl } from '@mantine/core';

export type ViewType = 'List' | 'Board' | 'Calendar';

export default function ViewSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: ViewType) => void;
}) {
  return (
    <SegmentedControl
      data={[
        {
          label: (
            <Center style={{ gap: 10 }}>
              <IconList size={16} />
              <span>List</span>
            </Center>
          ),
          value: 'List',
        },
        {
          label: (
            <Center style={{ gap: 10 }}>
              <IconLayoutKanbanFilled size={16} />
              <span>Board</span>
            </Center>
          ),
          value: 'Board',
        },
        {
          label: (
            <Center style={{ gap: 10 }}>
              <IconCalendarFilled size={16} />
              <span>Calendar</span>
            </Center>
          ),
          value: 'Calendar',
        },
      ]}
      value={value}
      onChange={(value) => onChange(value as ViewType)}
    />
  );
}
