import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Fieldset,
  FocusTrap,
  Group,
  NumberInput,
  Radio,
  Select,
  SimpleGrid,
  Stack,
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
import { NewTask, taskPrioritySelectOptions, TaskStatus } from '@/data/documentTypes/Task';
import { datePickerPresets } from '@/helpers/datePicker';
import { Logger } from '@/helpers/Logger';
import { Notifications } from '@/helpers/Notifications';

type RecurrenceValue = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
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
    recurrenceValue: RecurrenceValue;
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
      recurrence: undefined,
      recurrenceValue: 'none' as RecurrenceValue,
      recurrenceEndsValue: 'never',
    },
    validate: {
      title: (value) => (value ? null : 'Title is required'),
      waitUntil: (value, values) => {
        if (value && values.recurrenceValue !== 'none') {
          return 'Wait Until date cannot be set for recurring tasks';
        }
        return null;
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
      const status = form.values.waitUntil ? TaskStatus.Waiting : TaskStatus.Ready;

      const newTask: NewTask = {
        ...form.getValues(),
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

  // Recurrence can be a given value or a custom object, so we handle it accordingly
  const setRecurrence = (value: string) => {
    if (value === 'none') {
      form.setFieldValue('recurrence', undefined);
      form.setFieldValue('recurrenceValue', 'none');
    } else if (value === 'daily') {
      form.setFieldValue('recurrenceValue', 'daily');
      form.setFieldValue('recurrence', {
        frequency: 'daily',
        interval: 1,
      });
    } else if (value === 'weekly') {
      form.setFieldValue('recurrenceValue', 'weekly');
      form.setFieldValue('recurrence', {
        frequency: 'weekly',
        interval: 1,
        dayOfWeek: 'mon',
      });
    } else if (value === 'monthly') {
      form.setFieldValue('recurrenceValue', 'monthly');
      form.setFieldValue('recurrence', {
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 1,
      });
    } else if (value === 'custom') {
      form.setFieldValue('recurrenceValue', 'custom');
      // TBD
      form.setFieldValue('recurrence', {
        frequency: 'daily',
        interval: 1,
        ends: {
          afterOccurrences: 10, // Default to 10 occurrences
          onDate: undefined, // No end date by default
        },
      });
    }
  };

  // Recurrence monthly allows us to select one of two values, either the nth day of the month,
  // where n is today, or the nth specific weekday of the month, where n is the current weekday
  // of the month (1st, 2nd, etc)
  const monthlyRecurrenceOption = (): {
    dayOfMonth: number;
    dayOfWeek: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  } => {
    const today = dayjs();
    const dayOfMonth = today.date();
    const dayOfWeek = today.format('ddd').toLowerCase() as
      | 'mon'
      | 'tue'
      | 'wed'
      | 'thu'
      | 'fri'
      | 'sat'
      | 'sun';
    return { dayOfMonth, dayOfWeek };
  };

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

              <Select
                label="Recurrence"
                data={[
                  { value: 'none', label: 'None' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'custom', label: 'Custom' },
                ]}
                {...form.getInputProps('recurrenceValue')}
                onChange={(value) => {
                  if (value) {
                    setRecurrence(value);
                  }
                }}
              />
            </Stack>

            <Box hidden={form.values.recurrenceValue !== 'weekly'}>
              <Select
                label="Day of week"
                {...form.getInputProps('recurrence.dayOfWeek')}
                data={['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']}
              />
            </Box>

            <Box hidden={form.values.recurrenceValue == 'monthly'}>
              <NumberInput
                label="Day of month"
                {...form.getInputProps('recurrence.dayOfMonth')}
                min={1}
                max={31}
                step={1}
                placeholder="1"
                hidden={form.values.recurrenceValue !== 'monthly'}
              />
            </Box>

            <Box hidden={form.values.recurrenceValue !== 'custom'} pt={20}>
              <Fieldset legend="Recurrence Ends" mb={10}>
                <SimpleGrid cols={2} mb={20}>
                  <NumberInput
                    label="Repeat every"
                    {...form.getInputProps('recurrence.interval')}
                    value={form.values.recurrence?.interval || 1}
                  />
                  <Select
                    label="Frequency"
                    data={[
                      { value: 'daily', label: 'Day' },
                      { value: 'weekly', label: 'Week' },
                      { value: 'monthly', label: 'Month' },
                      { value: 'yearly', label: 'Year' },
                    ]}
                    {...form.getInputProps('recurrence.frequency')}
                    value={form.values.recurrence?.frequency || 'daily'}
                  />
                </SimpleGrid>

                <Radio.Group {...form.getInputProps('recurrenceEndsValue', { type: 'checkbox' })}>
                  <Stack>
                    <Group flex="row">
                      <Radio value="onDate" label="Ends on date" w="20%" />
                      <DatePickerInput
                        {...form.getInputProps('recurrence.ends.onDate')}
                        placeholder={dayjs().add(1, 'month').format('MM/DD/YYYY')}
                        disabled={form.values.recurrenceEndsValue !== 'onDate'}
                      />
                    </Group>
                    <Group flex="row">
                      <Radio value="afterOccurrences" label="Ends after" w="20%" />
                      <NumberInput
                        {...form.getInputProps('recurrence.ends.afterOccurrences')}
                        disabled={form.values.recurrenceEndsValue !== 'afterOccurrences'}
                      />
                      <Text size="sm">Occurrences</Text>
                    </Group>

                    <Radio value="never" label="Never ends" />
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
