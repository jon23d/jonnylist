import React from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import { Box, Button, Menu, SegmentedControl } from '@mantine/core';

export default function StatusSelector({
  status,
  setStatus,
}: {
  status: string;
  setStatus: (status: string) => void;
}) {
  const segmentedControlData = ['pending', 'completed', 'cancelled', 'recurring', 'waiting'].map(
    (s) => ({
      value: s,
      label: s.charAt(0).toUpperCase() + s.slice(1),
    })
  );

  // This component allows users to select the status of tasks. If the
  // screen is large, it shows a segmented control. If the screen is small,
  // it shows a button that opens a menu with the status options.
  return (
    <>
      <SegmentedControl
        data={segmentedControlData}
        value={status}
        onChange={setStatus}
        visibleFrom="lg"
        bg="gray.1"
        size="xs"
        bd="1px solid gray.3"
      />
      <Box hiddenFrom="lg">
        <Menu withArrow shadow="md">
          <Menu.Target>
            <Button
              size="xs"
              rightSection={<IconChevronRight size={15} />}
              bg="gray.1"
              c="gray.7"
              bd="1px solid gray.3"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} tasks
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => setStatus('pending')}>Pending</Menu.Item>
            <Menu.Item onClick={() => setStatus('completed')}>Completed</Menu.Item>
            <Menu.Item onClick={() => setStatus('cancelled')}>Cancelled</Menu.Item>
            <Menu.Item onClick={() => setStatus('recurring')}>Recurring</Menu.Item>
            <Menu.Item onClick={() => setStatus('waiting')}>Waiting</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    </>
  );
}
