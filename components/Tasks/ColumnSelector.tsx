import React from 'react';
import { Button, Popover, Stack, Switch } from '@mantine/core';

export default function ColumnSelector({
  choices,
  selected,
  onChange,
}: {
  choices: string[];
  selected: string[];
  onChange: (columns: string[]) => void;
}) {
  return (
    <Popover shadow="md" width={200}>
      <Popover.Target>
        <Button>Columns</Button>
      </Popover.Target>

      <Popover.Dropdown>
        <Switch.Group onChange={onChange} value={selected}>
          <Stack gap="xs">
            {choices.map((choice) => (
              <Switch label={choice} value={choice} key={choice} size="sm" />
            ))}
          </Stack>
        </Switch.Group>
      </Popover.Dropdown>
    </Popover>
  );
}
