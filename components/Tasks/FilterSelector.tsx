import { useState } from 'react';
import { Button, Popover, Stack, TagsInput } from '@mantine/core';
import { useForm } from '@mantine/form';

export interface TaskFilter {
  includeTags: string[];
  excludeTags: string[];
  includeProjects: string[];
  excludeProjects: string[];
}

export default function FilterSelector({
  includeTags,
  excludeTags,
  includeProjects,
  excludeProjects,
  setTaskFilter,
}: TaskFilter & {
  setTaskFilter: (taskFilter: TaskFilter) => void;
}) {
  const [opened, setOpened] = useState(false);

  const form = useForm<TaskFilter>({
    initialValues: {
      includeTags,
      excludeTags,
      includeProjects,
      excludeProjects,
    },
  });

  const handleSubmit = () => {
    setTaskFilter(form.values);
    setOpened(false);
  };

  const filterApplied =
    includeTags.length || excludeTags.length || includeProjects.length || excludeProjects.length;

  const targetLabel = filterApplied ? 'Filters (!)' : 'Filters';

  return (
    <Popover shadow="md" width={200} opened={opened} onDismiss={() => setOpened(false)}>
      <Popover.Target>
        <Button onClick={() => setOpened((prev) => !prev)}>{targetLabel}</Button>
      </Popover.Target>

      <Popover.Dropdown>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="xs">
            <TagsInput
              label="Include tags"
              {...form.getInputProps('includeTags')}
              size="xs"
              comboboxProps={{ withinPortal: false }} // required for use in popover
            />
            <TagsInput
              label="Exclude tags"
              {...form.getInputProps('excludeTags')}
              size="xs"
              comboboxProps={{ withinPortal: false }}
            />
            <TagsInput
              label="Include projects"
              {...form.getInputProps('includeProjects')}
              size="xs"
              comboboxProps={{ withinPortal: false }}
            />
            <TagsInput
              label="Exclude projexcts"
              {...form.getInputProps('excludeProjects')}
              size="xs"
              comboboxProps={{ withinPortal: false }}
            />
            <Button type="submit">Apply</Button>
            <Button>Save as Context</Button>
          </Stack>
        </form>
      </Popover.Dropdown>
    </Popover>
  );
}
