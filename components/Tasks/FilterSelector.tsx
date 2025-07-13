import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Group,
  Input,
  NumberInput,
  Popover,
  Stack,
  Tabs,
  TagsInput,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import SaveContextModal from '@/components/Contexts/SaveContextModal';
import { TaskFilter, TaskPriority } from '@/data/documentTypes/Task';

export default function FilterSelector({
  setTaskFilter,
  ...taskFilter
}: TaskFilter & {
  setTaskFilter: (taskFilter: TaskFilter) => void;
}) {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const [saveModalOpened, setSaveModalOpened] = useState(false);

  const form = useForm<TaskFilter>({
    initialValues: {
      ...taskFilter,
      dueWithin: {
        includeOverdueTasks: taskFilter.dueWithin?.includeOverdueTasks || false,
        minimumNumberOfDaysFromToday: taskFilter.dueWithin?.minimumNumberOfDaysFromToday || 0,
        maximumNumberOfDaysFromToday: taskFilter.dueWithin?.maximumNumberOfDaysFromToday,
      },
    },
    validate: {
      dueWithin: {
        includeOverdueTasks: (value, values) => {
          if (value && !values.dueWithin?.maximumNumberOfDaysFromToday) {
            return 'Requires maximum number of days from today';
          }
          return null;
        },
      },
    },
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
  const hasDates = form.values.dueWithin?.maximumNumberOfDaysFromToday;

  const filterApplied = hasTags || hasProjects || hasPriority || hasDates;

  const targetLabel = filterApplied ? 'Filters (!)' : 'Filters';

  // override onChange for the priority chip groups so that we do not allow both groups to select the same priority
  // after all, we can't both require and exclude a given priority
  const { onChange: onRequirePriorityChange, ..._requireProps } =
    form.getInputProps('requirePriority');
  const { onChange: onExcludePriorityChange, ..._excludeProps } =
    form.getInputProps('excludePriority');

  // These functions will handle the case where a priority is selected in require, but exists in exclude
  const requirePriorityInputProps = {
    ..._requireProps,
    onChange: (value: string[]) => {
      onRequirePriorityChange(value);

      // Is any of the values in this group in the other?
      if (value.some((v) => form.values.excludePriority?.includes(v as TaskPriority))) {
        // If so, remove it from the other group
        const newExcludePriority = form.values.excludePriority?.filter((v) => !value.includes(v));
        form.setFieldValue('excludePriority', newExcludePriority);
      }
    },
  };

  // The same applies to the exclude priority group
  const excludePriorityInputProps = {
    ..._excludeProps,
    onChange: (value: string[]) => {
      onExcludePriorityChange(value);

      // Is any of the values in this group in the other?
      if (value.some((v) => form.values.requirePriority?.includes(v as TaskPriority))) {
        // If so, remove it from the other group
        const newRequirePriority = form.values.requirePriority?.filter((v) => !value.includes(v));
        form.setFieldValue('requirePriority', newRequirePriority);
      }
    },
  };

  let defaultTab = '';

  if (hasDates) {
    defaultTab = 'dates';
  }
  if (hasPriority) {
    defaultTab = 'priority';
  }
  if (hasProjects) {
    defaultTab = 'projects';
  }
  if (!defaultTab || hasTags) {
    defaultTab = 'tags';
  }

  const tabWithDataProps = {
    fs: 'italic',
    fw: 600,
  };

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
            <Tabs defaultValue={defaultTab} orientation="vertical">
              <Tabs.List>
                <Tabs.Tab value="tags">
                  <Text size="sm" {...(hasTags && tabWithDataProps)}>
                    Tags
                  </Text>
                </Tabs.Tab>
                <Tabs.Tab value="projects">
                  <Text size="sm" {...(hasProjects && tabWithDataProps)}>
                    Projects
                  </Text>
                </Tabs.Tab>
                <Tabs.Tab value="priority">
                  <Text size="sm" {...(hasPriority && tabWithDataProps)}>
                    Priority
                  </Text>
                </Tabs.Tab>
                <Tabs.Tab value="dates" {...(hasDates && tabWithDataProps)}>
                  Dates
                </Tabs.Tab>
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
                    <Chip.Group multiple {...requirePriorityInputProps}>
                      <Group justify="space-evenly">
                        <Chip value={TaskPriority.Low} size="xs">
                          Low
                        </Chip>
                        <Chip value={TaskPriority.Medium} size="xs">
                          Medium
                        </Chip>
                        <Chip value={TaskPriority.High} size="xs">
                          High
                        </Chip>
                      </Group>
                    </Chip.Group>
                  </Input.Wrapper>
                  <Input.Wrapper label="Require priority" size="xs" mt=".3em">
                    <Chip.Group multiple {...excludePriorityInputProps}>
                      <Group justify="space-evenly">
                        <Chip value={TaskPriority.Low} size="xs">
                          Low
                        </Chip>
                        <Chip value={TaskPriority.Medium} size="xs">
                          Medium
                        </Chip>
                        <Chip value={TaskPriority.High} size="xs">
                          High
                        </Chip>
                      </Group>
                    </Chip.Group>
                  </Input.Wrapper>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="dates" p={5}>
                <Stack gap="xs">
                  <Text size="xs">
                    Show tasks with a due date between the number of days from today
                  </Text>
                  <NumberInput
                    label="Minimum days from today"
                    min={0}
                    {...form.getInputProps('dueWithin.minimumNumberOfDaysFromToday')}
                    size="xs"
                  />
                  <NumberInput
                    label="Maximum days from today"
                    {...form.getInputProps('dueWithin.maximumNumberOfDaysFromToday')}
                    size="xs"
                    mb={10}
                  />
                  <Checkbox
                    label="Include overdue tasks"
                    {...form.getInputProps('dueWithin.includeOverdueTasks', { type: 'checkbox' })}
                    size="xs"
                    mb={10}
                  />
                </Stack>
              </Tabs.Panel>
            </Tabs>
            <Box ml={100}>
              <Stack gap="xs">
                <Group justify="space-between" grow>
                  <Button type="submit">Apply</Button>
                  <Button onClick={handleClear}>Clear</Button>
                </Group>
                <Button disabled={!filterApplied} onClick={() => setSaveModalOpened(true)}>
                  Save as Context
                </Button>
              </Stack>
            </Box>
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
