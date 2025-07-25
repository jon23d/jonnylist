import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Chip,
  Fieldset,
  Flex,
  FocusTrap,
  Group,
  NumberInput,
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  TagsInput,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useHotkeys } from '@mantine/hooks';
import { useContextRepository, useTaskRepository } from '@/contexts/DataSourceContext';
import {
  NewTask,
  Recurrence,
  taskPrioritySelectOptions,
  TaskStatus,
} from '@/data/documentTypes/Task';
import { datePickerPresets } from '@/helpers/datePicker';
import { Logger } from '@/helpers/Logger';
import { Notifications } from '@/helpers/Notifications';

type RecurrenceEndsValue = 'onDate' | 'afterOccurrences' | 'never';

export default function NewTaskForm({ handleClose }: { handleClose: () => void }) {
  const router = useRouter();
  const taskRepository = useTaskRepository();
  const contextRepository = useContextRepository();
  const [activeTab, setActiveTab] = useState<string | null>('basics');

  // When the user changes tabs, we are going to focus on the first input in that tab
  const basicsPanelRef = useRef<HTMLDivElement>(null);
  const advancedPanelRef = useRef<HTMLDivElement>(null);

  // Hotkeys for tab navigation
  useHotkeys(
    [
      ['mod+shift+1', () => setActiveTab('basics')],
      ['mod+shift+2', () => setActiveTab('advanced')],
    ],
    []
  );

  type FormType = Omit<NewTask, 'status'> & {
    isRecurring: boolean;
    recurrenceEndsValue: RecurrenceEndsValue;
  };

  const form = useForm<FormType>({
    initialValues: {
      title: '',
      description: '',
      tags: [],
      project: '',
      priority: undefined,
      dueDate: undefined,
      waitUntil: undefined,
      isRecurring: false,
      recurrence: {
        frequency: 'daily',
        interval: 1,
        dayOfWeek: new Date().getDay(),
        dayOfMonth: new Date().getDate(),
        ends: {
          afterOccurrences: undefined,
          onDate: undefined,
        },
        yearlyFirstOccurrence: new Date().toISOString().split('T')[0], // Default to today
      },
      recurrenceEndsValue: 'never',
    },
    validate: {
      title: (value) => (value ? null : 'Title is required'),
      waitUntil: (value, values) => {
        if (value && values.isRecurring) {
          return 'Wait Until date cannot be set for recurring tasks';
        }
        return null;
      },
      recurrence: (value) => {
        if (value?.frequency === 'weekly' && value.dayOfWeek === undefined) {
          return 'A day of the week is required for weekly recurrence';
        }
      },
    },
  });

  useEffect(() => {
    // If a context is set, we may be able to grab some data from it
    const contextId = router.query.context;
    if (contextId) {
      contextRepository.getContext(contextId as string).then((context) => {
        if (context?.filter.requireProjects && context.filter.requireProjects.length === 1) {
          form.setFieldValue('project', context.filter.requireProjects[0]);
        }
        if (context?.filter.requireTags) {
          form.setFieldValue('tags', context.filter.requireTags);
        }
      });
    }
  }, [router.query]);

  // Focus on the first input of the active tab when it changes
  useEffect(() => {
    const panelRef = activeTab === 'basics' ? basicsPanelRef : advancedPanelRef;

    if (panelRef.current) {
      // Find the first focusable element within the active panel.
      const firstInput = panelRef.current.querySelector<HTMLElement>(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
      );
      // If an input is found, focus it.
      firstInput?.focus();
    }
  }, [activeTab]);

  const handleSave = async () => {
    try {
      let status = form.values.waitUntil ? TaskStatus.Waiting : TaskStatus.Ready;

      // Clean up the recurrence object to remove unused values
      let recurrence: Recurrence | undefined;

      if (form.values.isRecurring) {
        recurrence = form.values.recurrence as Recurrence;
        status = TaskStatus.Recurring;

        if (recurrence.frequency !== 'weekly') {
          recurrence.dayOfWeek = undefined;
        }
        if (recurrence.frequency !== 'monthly') {
          recurrence.dayOfMonth = undefined;
        }
        if (recurrence.frequency !== 'yearly') {
          recurrence.yearlyFirstOccurrence = undefined;
        }

        recurrence.dayOfWeek = recurrence.dayOfWeek ? Number(recurrence.dayOfWeek) : undefined;
        recurrence.dayOfMonth = recurrence.dayOfMonth ? Number(recurrence.dayOfMonth) : undefined;
      } else {
        recurrence = undefined;
      }

      const newTask: NewTask = {
        ...form.getValues(),
        recurrence,
        status,
      };

      await taskRepository.addTask(newTask);

      Notifications.showQuickSuccess('Task added');

      form.reset();

      // We want to make sure that we've cleared focus so that keyboard navigation works properly
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      handleClose();
    } catch (error) {
      // @TODO handle error properly
      Logger.error('Error saving task:', error);
    }
  };

  // If the advanced tab has data on it, we want for the user to be able to tell at a glance
  const advancedHasData = form.values.waitUntil || form.values.description;
  const hasDataProps = { fs: 'italic', fw: 600 };

  // We are going to highlight the tabs that have errors in them
  const basicsHasErrors = Object.keys(form.errors).filter((item) =>
    ['title', 'tags', 'project', 'priority', 'dueDate'].includes(item)
  ).length;
  const advancedHasErrors = Object.keys(form.errors).filter((item) =>
    ['description', 'waitUntil', 'isRecurring'].includes(item)
  ).length;

  return (
    <form onSubmit={form.onSubmit(handleSave)}>
      <FocusTrap>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb={10}>
            <Tabs.Tab value="basics">
              <Text size="sm" c={basicsHasErrors ? 'red.9' : 'black'}>
                Basics
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="advanced">
              <Text
                size="sm"
                {...(advancedHasData && hasDataProps)}
                c={advancedHasErrors ? 'red.9' : 'black'}
              >
                Advanced
              </Text>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="basics" ref={basicsPanelRef}>
            <Stack gap="xs">
              <TextInput
                label="Title"
                {...form.getInputProps('title')}
                withAsterisk
                data-autofocus
              />

              <TagsInput label="Tags" {...form.getInputProps('tags')} />
              <TextInput label="Project" {...form.getInputProps('project')} />

              <Select
                label="Priority"
                data={taskPrioritySelectOptions}
                {...form.getInputProps('priority')}
                searchable
              />
              <DatePickerInput
                label="Due Date"
                {...form.getInputProps('dueDate')}
                clearable
                highlightToday
                presets={datePickerPresets}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="advanced" ref={advancedPanelRef}>
            <Stack gap="xs">
              <Textarea
                label="Description"
                autosize
                minRows={3}
                {...form.getInputProps('description')}
              />

              <DatePickerInput
                label="Wait Until"
                description="On this date, the task will be moved from waiting to pending"
                {...form.getInputProps('waitUntil')}
                clearable
                highlightToday
                presets={datePickerPresets}
              />

              <Switch
                label="Repeating"
                {...form.getInputProps('isRecurring', { type: 'checkbox' })}
              />
            </Stack>

            <Box hidden={!form.values.isRecurring} mt={10}>
              <SimpleGrid cols={2} mb={20}>
                <NumberInput
                  label="Repeat every"
                  {...form.getInputProps('recurrence.interval')}
                  value={form.values.recurrence?.interval || 1}
                />
                <Select
                  label="Frequency"
                  clearable={false}
                  data={[
                    {
                      value: 'daily',
                      label: form.values.recurrence?.interval === 1 ? 'Day' : 'Days',
                    },
                    {
                      value: 'weekly',
                      label: form.values.recurrence?.interval === 1 ? 'Week' : 'Weeks',
                    },
                    {
                      value: 'monthly',
                      label: form.values.recurrence?.interval === 1 ? 'Month' : 'Months',
                    },
                    {
                      value: 'yearly',
                      label: form.values.recurrence?.interval === 1 ? 'Year' : 'Years',
                    },
                  ]}
                  {...form.getInputProps('recurrence.frequency')}
                  value={form.values.recurrence?.frequency || 'daily'}
                />
              </SimpleGrid>
            </Box>

            <Box hidden={form.values.recurrence?.frequency !== 'weekly'} mt={10}>
              <Flex>
                <Chip.Group
                  {...form.getInputProps('recurrence.dayOfWeek', { type: 'checkbox' })}
                  defaultValue={new Date().getDay().toString()}
                  aria-label="Day of the week"
                >
                  <Group justify="center">
                    <Chip value="1">Mon</Chip>
                    <Chip value="2">Tues</Chip>
                    <Chip value="3">Weds</Chip>
                    <Chip value="4">Thurs</Chip>
                    <Chip value="5">Fri</Chip>
                    <Chip value="6">Sat</Chip>
                    <Chip value="0">Sun</Chip>
                  </Group>
                </Chip.Group>
              </Flex>
            </Box>

            <Box hidden={form.values.recurrence?.frequency !== 'monthly'}>
              <Group flex="row">
                <NumberInput
                  label="Day of month"
                  {...form.getInputProps('recurrence.dayOfMonth')}
                  defaultValue={new Date().getDate()}
                  max={31}
                  min={1}
                  w="20%"
                />
                <Text size="sm" c="dimmed" flex={1} pt={25}>
                  Hint: If this is greater than the number of days in a month, it will be adjusted
                  to the last day of that month.
                </Text>
              </Group>
            </Box>

            <Box hidden={form.values.recurrence?.frequency !== 'yearly'}>
              <DatePickerInput
                label="First occurence"
                {...form.getInputProps('recurrence.yearlyFirstOccurrence')}
                highlightToday
              />
            </Box>

            <Box hidden={!form.values.isRecurring} mt={20}>
              <Fieldset legend="Recurrence Ends" mb={10}>
                <Radio.Group {...form.getInputProps('recurrenceEndsValue')}>
                  <Stack>
                    <Radio value="never" label="Never ends" />
                    <Group flex="row">
                      <Radio value="onDate" label="Ends on date" w="25%" />
                      <DatePickerInput
                        {...form.getInputProps('recurrence.ends.onDate')}
                        placeholder={dayjs().add(1, 'month').format('MM/DD/YYYY')}
                        highlightToday
                        disabled={form.values.recurrenceEndsValue !== 'onDate'}
                      />
                    </Group>
                    <Group flex="row">
                      <Radio value="afterOccurrences" label="Ends after" w="25%" />
                      <NumberInput
                        {...form.getInputProps('recurrence.ends.afterOccurrences')}
                        disabled={form.values.recurrenceEndsValue !== 'afterOccurrences'}
                      />
                      <Text size="sm">Occurrences</Text>
                    </Group>
                  </Stack>
                </Radio.Group>
              </Fieldset>
            </Box>
          </Tabs.Panel>
        </Tabs>

        <Button type="submit" mt={20}>
          Create Task
        </Button>
      </FocusTrap>
    </form>
  );
}
