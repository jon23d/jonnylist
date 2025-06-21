import React from 'react';
import { Anchor, Text } from '@mantine/core';
import AddNewItemButton from '@/components/Layout/NewItem/AddNewItemButton';
import classes from './Layout.module.css';

export default function HeaderLinks() {
  return (
    <>
      <div>
        <Text size="xs" fw={800} c="black" ml={{ xs: 0, sm: 60 }} visibleFrom="sm">
          JonnyList
        </Text>
      </div>
      <AddNewItemButton />
      <div className={classes.withSeparators}>
        <Text size="xs" c="gray.6">
          <Anchor href="#">4 tasks due today</Anchor>
          <Anchor href="#">12 tasks in progress</Anchor>
          <Anchor href="#" visibleFrom="xs">
            3 open projects
          </Anchor>
        </Text>
      </div>
    </>
  );
}
