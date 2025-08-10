import React, { useState } from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import { Button, Divider, Popover, Stack, Switch } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';

export default function ColumnSelector({
  choices,
  selected,
  onChange,
}: {
  choices: string[];
  selected: string[];
  onChange: (columns: string[]) => void;
}) {
  const [opened, setOpened] = useState(false);

  // Capture the escape key to close the popover
  useHotkeys([['Escape', () => setOpened(false)]]);

  return (
    <Popover shadow="md" width={200} onDismiss={() => setOpened(false)} opened={opened}>
      <Popover.Target>
        <Button
          size="xs"
          c="gray.7"
          bg="gray.1"
          bd="1px solid gray.3"
          rightSection={<IconChevronRight size={15} />}
          onClick={() => setOpened((o) => !o)}
        >
          Columns
        </Button>
      </Popover.Target>

      <Popover.Dropdown>
        <Switch.Group onChange={onChange} value={selected}>
          <Stack gap="xs">
            {choices.map((choice, index) => {
              if (choice === '-') {
                return <Divider key={index} my="sm" />;
              }
              return <Switch label={choice} value={choice} key={choice} size="sm" />;
            })}
          </Stack>
        </Switch.Group>
      </Popover.Dropdown>
    </Popover>
  );
}
