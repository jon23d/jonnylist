import { useState } from 'react';
import { Button, Popover, Stack, TagsInput } from '@mantine/core';
import { useForm } from '@mantine/form';

export interface TaskFilter {
  requireTags: string[];
  excludeTags: string[];
  requireProjects: string[];
  excludeProjects: string[];
}

export default function FilterSelector({
  requireTags,
  excludeTags,
  requireProjects,
  excludeProjects,
  setTaskFilter,
}: TaskFilter & {
  setTaskFilter: (taskFilter: TaskFilter) => void;
}) {
  const [opened, setOpened] = useState(false);

  const form = useForm<TaskFilter>({
    initialValues: {
      requireTags,
      excludeTags,
      requireProjects,
      excludeProjects,
    },
  });

  const handleSubmit = () => {
    setTaskFilter(form.values);
    setOpened(false);
  };

  const filterApplied =
    requireTags.length || excludeTags.length || requireProjects.length || excludeProjects.length;

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
              label="Require tags"
              {...form.getInputProps('requireTags')}
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
              label="Require projects"
              {...form.getInputProps('requireProjects')}
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
