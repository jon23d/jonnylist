import React from 'react';
import { IconList, IconTable } from '@tabler/icons-react';
import { Box, Button, Menu, SegmentedControl, Text } from '@mantine/core';

export default function ViewTypeSelector({
  view,
  setView,
}: {
  view: 'list' | 'table';
  setView: (view: 'list' | 'table') => void;
}) {
  // This component allows users to select the view type for tasks.
  // It shows a segmented control for larger screens and a button menu for smaller screens.
  return (
    <>
      <SegmentedControl
        visibleFrom="sm"
        data={[
          {
            value: 'table',
            label: (
              <Text size="xs" ta="center">
                <IconTable size={10} style={{ marginRight: '5px' }} />
                Table
              </Text>
            ),
          },
          {
            value: 'list',
            label: (
              <Text size="xs" ta="center">
                <IconList size={10} style={{ marginRight: '5px' }} />
                List
              </Text>
            ),
          },
        ]}
        value={view}
        onChange={(value) => setView(value as 'list' | 'table')}
        size="xs"
      />
      <Box hiddenFrom="sm">
        <Menu>
          <Menu.Target>
            <Button size="xs">{view.charAt(0).toUpperCase() + view.slice(1)} view</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => setView('table')}>
              <IconTable size={10} style={{ marginRight: '5px' }} />
              Table
            </Menu.Item>
            <Menu.Item onClick={() => setView('list')}>
              <IconList size={10} style={{ marginRight: '5px' }} />
              List
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    </>
  );
}
