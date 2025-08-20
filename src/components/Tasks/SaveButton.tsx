import React from 'react';
import { IconChevronDown, IconCirclePlus } from '@tabler/icons-react';
import { ActionIcon, Button, Group, Menu, useMantineTheme } from '@mantine/core';
import classes from './SaveButton.module.css';

export function SaveButton({
  handleSave,
  handleSaveAndNew,
  isNewTask,
}: {
  handleSave: () => void;
  handleSaveAndNew: () => void;
  isNewTask: boolean;
}) {
  const theme = useMantineTheme();

  if (!isNewTask) {
    return <Button onClick={handleSave}>Save Task</Button>;
  }

  return (
    <Group wrap="nowrap" gap={0}>
      <Button className={classes.button} onClick={handleSave}>
        Save Task
      </Button>
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon
            variant="filled"
            size={36}
            className={classes.menuControl}
            color={theme.primaryColor}
          >
            <IconChevronDown size={16} stroke={1.5} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconCirclePlus size={16} stroke={1.5} color={theme.colors.blue[5]} />}
            onClick={handleSaveAndNew}
          >
            Save and Create New
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
