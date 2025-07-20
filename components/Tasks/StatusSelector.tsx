import React from 'react';
import { Box, Button, Menu, SegmentedControl } from '@mantine/core';

export default function StatusSelector({
  status,
  setStatus,
}: {
  status: string;
  setStatus: (status: string) => void;
}) {
  // This component allows users to select the status of tasks. If the
  // screen is large, it shows a segmented control. If the screen is small,
  // it shows a button that opens a menu with the status options.
  return (
    <>
      <SegmentedControl
        data={['pending', 'completed', 'cancelled', 'recurring', 'waiting']}
        value={status}
        onChange={setStatus}
        size="xs"
        visibleFrom="sm"
      />
      <Box hiddenFrom="sm">
        <Menu>
          <Menu.Target>
            <Button size="xs">{status.charAt(0).toUpperCase() + status.slice(1)} tasks</Button>
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
