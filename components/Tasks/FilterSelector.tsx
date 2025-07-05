import { useState } from 'react';
import { Button, Chip, Group, Input, Popover, Stack, Tabs, TagsInput, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import SaveContextModal from '@/components/Contexts/SaveContextModal';
import { TaskFilter } from '@/data/documentTypes/Task';

export default function FilterSelector({
  setTaskFilter,
  ...taskFilter
}: TaskFilter & {
  setTaskFilter: (taskFilter: TaskFilter) => void;
}) {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [saveModalOpened, setSaveModalOpened] = useState(false);

  const form = useForm<TaskFilter>({
    initialValues: taskFilter,
  });

  const handleSubmit = () => {
    setTaskFilter(form.values);
    setPopoverOpened(false);
  };

  const handleClear = () => {
    form.setValues({});
    setTaskFilter({});
    setPopoverOpened(false);
  };

  const hasTags = form.values.requireTags?.length || form.values.excludeTags?.length;
  const hasProjects = form.values.requireProjects?.length || form.values.excludeProjects?.length;
  const hasPriority = form.values.requirePriority?.length || form.values.excludePriority?.length;

  const filterApplied = hasTags || hasProjects;

  const targetLabel = filterApplied ? 'Filters (!)' : 'Filters';

  return (
    <>
      <Popover
        shadow="md"
        width={400}
        opened={popoverOpened}
        onDismiss={() => setPopoverOpened(false)}
      >
        <Popover.Target>
          <Button onClick={() => setPopoverOpened((prev) => !prev)}>{targetLabel}</Button>
        </Popover.Target>

        <Popover.Dropdown>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Tabs defaultValue="gallery" orientation="vertical">
              <Tabs.List>
                <Tabs.Tab value="tags">
                  <Text size="sm" fw={hasTags ? 800 : undefined}>
                    Tags
                  </Text>
                </Tabs.Tab>
                <Tabs.Tab value="projects">
                  <Text size="sm" fw={hasProjects ? 800 : undefined}>
                    Projects
                  </Text>
                </Tabs.Tab>
                <Tabs.Tab value="priority">
                  <Text size="sm" fw={hasPriority ? 800 : undefined}>
                    Priority
                  </Text>
                </Tabs.Tab>
                <Tabs.Tab value="dates">Dates</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="tags" p={5}>
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
                </Stack>
              </Tabs.Panel>
              <Tabs.Panel value="projects" p={5}>
                <Stack gap="xs">
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
                </Stack>
              </Tabs.Panel>
              <Tabs.Panel value="priority" p={5}>
                <Stack gap="xs">
                  <Input.Wrapper label="Require priority" size="xs">
                    <Chip.Group multiple>
                      <Group justify="space-between">
                        <Chip value="1">Low</Chip>
                        <Chip value="2">Medium</Chip>
                        <Chip value="3">High</Chip>
                      </Group>
                    </Chip.Group>
                  </Input.Wrapper>
                  <Input.Wrapper label="Require priority" size="xs">
                    <Chip.Group multiple>
                      <Group justify="space-between">
                        <Chip value="1">Low</Chip>
                        <Chip value="2">Medium</Chip>
                        <Chip value="3">High</Chip>
                      </Group>
                    </Chip.Group>
                  </Input.Wrapper>
                </Stack>
              </Tabs.Panel>
              <Tabs.Panel value="dates" p={5}>
                Settings tab content
              </Tabs.Panel>
            </Tabs>
            <Stack gap="xs">
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
