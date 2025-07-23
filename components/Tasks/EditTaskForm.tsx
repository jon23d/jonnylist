import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Fieldset,
  Flex,
  FocusTrap,
  Group,
  NumberInput,
  Paper,
  Radio,
  ScrollArea,
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
import { useTaskRepository } from '@/contexts/DataSourceContext';
import {
  NewTask,
  Recurrence,
  Task,
  taskPrioritySelectOptions,
  TaskStatus,
  taskStatusSelectOptions,
} from '@/data/documentTypes/Task';
import { datePickerPresets } from '@/helpers/datePicker';
import { Logger } from '@/helpers/Logger';
import { Notifications } from '@/helpers/Notifications';

type RecurrenceEndsValue = 'onDate' | 'afterOccurrences' | 'never';

export default function EditTaskForm({
  task,
  handleClose,
}: {
  task: Task;
  handleClose: () => void;
}) {
  const taskRepository = useTaskRepository();
  const [activeTab, setActiveTab] = useState<string | null>('basics');
  const [newNoteText, setNewNoteText] = useState<string>('');

  // When the user changes tabs, we are going to focus on the first input in that tab
  const basicsPanelRef = useRef<HTMLDivElement>(null);
  const advancedPanelRef = useRef<HTMLDivElement>(null);
  const notesPanelRef = useRef<HTMLDivElement>(null);

  // Hotkeys for tab navigation
  useHotkeys(
    [
      ['mod+shift+1', () => setActiveTab('basics')],
      ['mod+shift+2', () => setActiveTab('advanced')],
      ['mod+shift+3', () => setActiveTab('notes')],
    ],
    []
  );

  type FormType = NewTask & {
    isRecurring: boolean;
    recurrenceEndsValue: RecurrenceEndsValue;
  };

  const form = useForm<FormType>({
    // NewTask is a task without metadata, INCLUDING notes. These are updated separately.
    initialValues: {
      title: task.title,
      description: task.description,
      tags: task.tags,
      project: task.project,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
      waitUntil: task.waitUntil,
      isRecurring: !!task.recurrence?.frequency,
      recurrence: task.recurrence || {
        frequency: 'daily',
        interval: 1,
        dayOfWeek: new Date().getDay(),
        dayOfMonth: new Date().getDate(),
        ends: {
          afterOccurrences: undefined,
          onDate: undefined,
        },
        yearlyFirstOccurrence: new Date().toISOString().split('T')[0], // Default to today,
      },
      recurrenceEndsValue: task.recurrence?.ends?.onDate
        ? 'onDate'
        : task.recurrence?.ends?.afterOccurrences
          ? 'afterOccurrences'
          : 'never',
    },
    validate: {
      title: (value) => (value ? null : 'Title is required'),
      status: (value) => (value ? null : 'Status is required'),
      waitUntil: (value, values) => {
        if (value && values.isRecurring) {
          return 'Wait Until date cannot be set for recurring tasks';
        }
        return null;
      },
    },
  });

  // Focus on the first input of the active tab when it changes
  useEffect(() => {
    let panelRef;
    switch (activeTab) {
      case 'basics':
        panelRef = basicsPanelRef;
        break;
      case 'advanced':
        panelRef = advancedPanelRef;
        break;
      case 'notes':
        panelRef = notesPanelRef;
        break;
      default:
        return;
    }

    // Find the first focusable element within the active panel.
    if (panelRef.current) {
      const firstInput = panelRef.current.querySelector<HTMLElement>('input, textarea');
      firstInput?.focus();
    }
  }, [activeTab]);

  const handleSave = async () => {
    try {
      // Clean up the recurrence object to remove unused values
      let recurrence: Recurrence | undefined;
      let status: TaskStatus = form.values.status;

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
      } else {
        recurrence = undefined;
      }

      await taskRepository.updateTask({
        ...task,
        ...form.getValues(),
        status,
        recurrence,
      });

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

  const handleAddNote = async () => {
    try {
      const { _rev, notes } = await taskRepository.addNote(task._id, newNoteText);
      setNewNoteText(''); // Clear the note input after adding
      // Update the task with the new note and revision
      task.notes = notes;
      task._rev = _rev;
    } catch (error) {
      Notifications.showError({ message: 'Unable to add note to task', title: 'Error' });
    }
  };

  // If the advanced tab has data on it, we want for the user to be able to tell at a glance
  const advancedHasData = form.values.waitUntil || form.values.description;
  const notesHasData = task.notes && task.notes.length > 0;
  const hasDataProps = { fs: 'italic', fw: 600 };

  const notesDisplay =
    task.notes && task.notes.length > 0
      ? task.notes.map((note, index) => (
          <Paper key={index} mb={10} shadow="xs" p={10} mr={20}>
            <Text span size="xs" fw={700} c="dimmed">
              {new Date(note.createdAt).toLocaleString()}
            </Text>
            <Text mt={10}>{note.noteText}</Text>
          </Paper>
        ))
      : null;

  return (
    <form onSubmit={form.onSubmit(handleSave)}>
      <FocusTrap>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb={10}>
            <Tabs.Tab value="basics">
              <Text size="sm">Basics</Text>
            </Tabs.Tab>
            <Tabs.Tab value="advanced">
              <Text size="sm" {...(advancedHasData && hasDataProps)}>
                Advanced
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="notes">
              <Text size="sm" {...(notesHasData && hasDataProps)}>
                Notes
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
                clearable
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

              <Select
                label="Status"
                data={taskStatusSelectOptions}
                {...form.getInputProps('status')}
                clearable={false}
                allowDeselect={false}
                withAsterisk
                size="xs"
                searchable
              />

              <Button type="submit" mt={20}>
                Update Task
              </Button>
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
                  />
                </SimpleGrid>

                <Box hidden={form.values.recurrence?.frequency !== 'weekly'} mt={10}>
                  <Flex>
                    <Chip.Group
                      multiple
                      {...form.getInputProps('recurrence.dayOfWeek', { type: 'checkbox' })}
                    >
                      <Group justify="center">
                        <Chip value="1">Mon</Chip>
                        <Chip value="2">Tues</Chip>
                        <Chip value="3">Weds</Chip>
                        <Chip value="4">Thurs</Chip>
                        <Chip value="5">Fri</Chip>
                        <Chip value="6">Sat</Chip>
                        <Chip value="7">Sun</Chip>
                      </Group>
                    </Chip.Group>
                  </Flex>
                </Box>

                <Box hidden={form.values.recurrence?.frequency !== 'monthly'}>
                  <Group flex="row">
                    <NumberInput
                      label="Day of month"
                      {...form.getInputProps('recurrence.dayOfMonth')}
                      max={31}
                      min={1}
                      w="20%"
                    />
                    <Text size="sm" c="dimmed" flex={1} pt={25}>
                      Hint: If this is greater than the number of days in a month, it will be
                      adjusted to the last day of that month.
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
              </Box>

              <Button type="submit" mt={20}>
                Update Task
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="notes" ref={notesPanelRef}>
            <Stack gap="xs">
              <Textarea
                label="New Note"
                autosize
                minRows={3}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.currentTarget.value)}
              />
              <Button onClick={handleAddNote}>Add Note</Button>
              <ScrollArea.Autosize mah={300} type="auto">
                {notesDisplay}
              </ScrollArea.Autosize>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </FocusTrap>
    </form>
  );
}
