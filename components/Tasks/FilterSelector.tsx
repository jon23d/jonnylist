import { useState } from 'react';
import { Button, Popover, Stack, TagsInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import SaveContextModal from '@/components/Contexts/SaveContextModal';
import { TaskFilter } from '@/data/documentTypes/Task';

export default function FilterSelector({
  requireTags,
  excludeTags,
  requireProjects,
  excludeProjects,
  setTaskFilter,
}: TaskFilter & {
  setTaskFilter: (taskFilter: TaskFilter) => void;
}) {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [saveModalOpened, setSaveModalOpened] = useState(false);

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
    setPopoverOpened(false);
  };

  const handleClear = () => {
    const clearedValues = {
      requireTags: [],
      excludeTags: [],
      requireProjects: [],
      excludeProjects: [],
    };

    form.setValues(clearedValues);
    setTaskFilter(clearedValues);
    setPopoverOpened(false);
  };

  const filterApplied =
    form.values.requireTags.length ||
    form.values.excludeTags.length ||
    form.values.requireProjects.length ||
    form.values.excludeProjects.length;

  const targetLabel = filterApplied ? 'Filters (!)' : 'Filters';

  return (
    <>
      <Popover
        shadow="md"
        width={200}
        opened={popoverOpened}
        onDismiss={() => setPopoverOpened(false)}
      >
        <Popover.Target>
          <Button onClick={() => setPopoverOpened((prev) => !prev)}>{targetLabel}</Button>
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
                label="Exclude projects"
                {...form.getInputProps('excludeProjects')}
                size="xs"
                comboboxProps={{ withinPortal: false }}
              />
              <Button type="submit">Apply</Button>
              <Button onClick={handleClear}>Clear</Button>
              <Button disabled={!filterApplied} onClick={() => setSaveModalOpened(true)}>
                Save as Context
              </Button>
            </Stack>
          </form>
        </Popover.Dropdown>

        <SaveContextModal
          filter={form.values}
          opened={saveModalOpened}
          onClose={() => setSaveModalOpened(false)}
        />
      </Popover>
    </>
  );
}
