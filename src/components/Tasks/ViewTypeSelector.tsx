import React from 'react';
import { IconChevronRight, IconList, IconTable } from '@tabler/icons-react';
import { Box, Button, Menu, SegmentedControl } from '@mantine/core';

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
        visibleFrom="lg"
        data={[
          {
            value: 'table',
            label: (
              <>
                <IconTable size={10} style={{ marginRight: '5px' }} />
                Table
              </>
            ),
          },
          {
            value: 'list',
            label: (
              <>
                <IconList size={10} style={{ marginRight: '5px' }} />
                List
              </>
            ),
          },
        ]}
        value={view}
        onChange={(value) => setView(value as 'list' | 'table')}
        size="xs"
        bd="1px solid gray.3"
      />
      <Box hiddenFrom="lg">
        <Menu shadow="md">
          <Menu.Target>
            <Button
              size="xs"
              rightSection={<IconChevronRight size={15} />}
              bg="gray.1"
              c="gray.7"
              bd="1px solid gray.3"
            >
              {view.charAt(0).toUpperCase() + view.slice(1)} view
            </Button>
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
