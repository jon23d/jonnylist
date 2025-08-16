import React, { useState } from 'react';
import { IconChevronRight, IconInfoCircle } from '@tabler/icons-react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Flex,
  Group,
  Input,
  NumberInput,
  Popover,
  Stack,
  Tabs,
  TagsInput,
  Text,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useHotkeys } from '@mantine/hooks';
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

  useHotkeys([['Escape', () => setPopoverOpened(false)]]);

  const form = useForm<TaskFilter>({
    initialValues: {
      ...taskFilter,
      dueWithin: {
        includeOverdueTasks: taskFilter.dueWithin?.includeOverdueTasks || false,
        minimumNumberOfDaysFromToday: taskFilter.dueWithin?.minimumNumberOfDaysFromToday,
        maximumNumberOfDaysFromToday: taskFilter.dueWithin?.maximumNumberOfDaysFromToday,
      },
    },
    validate: {
      dueWithin: {
        minimumNumberOfDaysFromToday: (value) => {
          if (value !== undefined && value < 0) {
            return 'Minimum days from today cannot be negative';
          }
          return null;
        },
        maximumNumberOfDaysFromToday: (value) => {
          if (value !== undefined && value < 0) {
            return 'Maximum days from today cannot be negative';
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

  // Create a label for the button that will open the filters popover.
  // If any filter is applied, the label will be "Filters (!)", otherwise it will be "Filters".
  // This is used to indicate to the user that there are filters applied.
  const hasTags =
    form.values.requireTags?.length || form.values.excludeTags?.length || form.values.hasNoTags;
  const hasProjects =
    form.values.requireProjects?.length ||
    form.values.excludeProjects?.length ||
    form.values.hasNoProject;
  const hasPriority = form.values.requirePriority?.length || form.values.excludePriority?.length;
  const hasDates =
    form.values.dueWithin?.maximumNumberOfDaysFromToday !== undefined ||
    form.values.dueWithin?.minimumNumberOfDaysFromToday !== undefined;

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
          <Box>
            <Button
              size="xs"
              bg="gray.1"
              c="gray.7"
              rightSection={<IconChevronRight size={15} />}
              onClick={() => setPopoverOpened((prev) => !prev)}
              bd="1px solid gray.3"
            >
              {targetLabel}
            </Button>
          </Box>
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
                <Stack gap="xs" mb={10}>
                  <TagsInput
                    label={
                      <Tooltip label="Require at least one of">
                        <Text size="xs">
                          Require tags <IconInfoCircle size={12} />
                        </Text>
                      </Tooltip>
                    }
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
                  <Checkbox
                    label="Has no tags"
                    {...form.getInputProps('hasNoTags', { type: 'checkbox' })}
                    size="xs"
                  />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="projects" p={5}>
                <Stack gap="xs" mb={10}>
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
                  <Checkbox
                    label="Has no project"
                    {...form.getInputProps('hasNoProject', { type: 'checkbox' })}
                    size="xs"
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
                  <Input.Wrapper label="Exclude priority" size="xs" mt=".3em">
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
                    Show tasks with a due date within the specified range from today.
                  </Text>
                  <Flex>
                    <NumberInput
                      label="Minimum days from today"
                      {...form.getInputProps('dueWithin.minimumNumberOfDaysFromToday')}
                      size="xs"
                      flex={1}
                    />
                    <Button
                      size="xs"
                      variant="subtle"
                      mt={25}
                      ml={5}
                      onClick={() =>
                        form.setFieldValue(
                          'dueWithin.minimumNumberOfDaysFromToday',
                          '' as unknown as number
                        )
                      }
                    >
                      Clear
                    </Button>
                  </Flex>

                  <Flex>
                    <NumberInput
                      label="Maximum days from today"
                      {...form.getInputProps('dueWithin.maximumNumberOfDaysFromToday')}
                      size="xs"
                      mb={10}
                      flex={1}
                    />
                    <Button
                      size="xs"
                      variant="subtle"
                      mt={25}
                      ml={5}
                      onClick={() =>
                        form.setFieldValue(
                          'dueWithin.maximumNumberOfDaysFromToday',
                          '' as unknown as number
                        )
                      }
                    >
                      Clear
                    </Button>
                  </Flex>

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
