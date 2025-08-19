import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  ActionIcon,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Fieldset,
  Flex,
  FocusTrap,
  Group,
  Menu,
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
import { UseFormReturnType } from '@mantine/form';
import { useHotkeys, useOs } from '@mantine/hooks';
import { IconChevronDown } from '@tabler/icons-react';
import sharedStyle from '@/components/style.module.css';
import {
  NewTask,
  Note,
  taskPrioritySelectOptions,
  taskStatusSelectOptions,
} from '@/data/documentTypes/Task';
import { datePickerPresets } from '@/helpers/datePicker';

type RecurrenceEndsValue = 'onDate' | 'afterOccurrences' | 'never';
export type TaskFormType = NewTask & {
  isRecurring: boolean;
  recurrenceEndsValue?: RecurrenceEndsValue;
  notes: Note[];
};

export default function TaskForm({
  form,
  handleSubmit,
  isNewTask,
  handleSaveAndCreateAnother,
}: {
  form: UseFormReturnType<TaskFormType>;
  handleSubmit: () => void;
  isNewTask: boolean;
  handleSaveAndCreateAnother?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<string | null>('basics');
  const [newNoteText, setNewNoteText] = useState<string>('');
  const os = useOs();

  // When the user changes tabs, we are going to focus on the first input in that tab
  // But only on desktop. This is really annoying on mobile, so we disable it there.
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

  // For easier keyboard navigation, focus on the first input of the active tab
  useEffect(() => {
    if (os === 'ios' || os === 'android') {
      return;
    }

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

  // Let the user know if a tab has data on it
  const advancedHasData =
    form.values.waitUntil || form.values.description || form.values.isRecurring;
  const notesHasData = form.values.notes && form.values.notes.length > 0;

  // We are going to highlight the tabs that have errors in them
  const basicsHasErrors = Object.keys(form.errors).filter((item) =>
    ['title', 'tags', 'project', 'priority', 'dueDate'].includes(item)
  ).length;
  const advancedHasErrors = Object.keys(form.errors).filter((item) =>
    ['description', 'waitUntil', 'isRecurring'].includes(item)
  ).length;

  // The list of notes
  const notesDisplay =
    form.values.notes && form.values.notes.length > 0
      ? form.values.notes.map((note, index) => (
          <Paper key={index} mb={10} shadow="md" p={10} mr={20} data-testid={`note-${index}`}>
            <Text span size="xs" fw={700} c="dimmed">
              {new Date(note.createdAt).toLocaleString()}
            </Text>
            <Text mt={10}>{note.noteText}</Text>
          </Paper>
        ))
      : null;

  const handleAddNote = async () => {
    if (!newNoteText.trim()) {
      return; // Don't add empty notes
    }

    const newNote: Note = {
      noteText: newNoteText,
      createdAt: new Date().toISOString(),
    };

    // Update the form values with the new note
    form.setFieldValue('notes', [...(form.values.notes || []), newNote]);
    setNewNoteText(''); // Clear the input field after adding the note

    // If this is not a new task, we will submit the form to save the note
    if (!isNewTask) {
      handleSubmit();
    }
  };

  const pluralizeInterval = form.values.recurrence?.interval === 1;

  const saveButton = (tabName: 'basics' | 'advanced') => (
    <Group mt={20}>
      <ButtonGroup>
        <Button type="submit" data-testid={`save-button-${tabName}`}>
          Save Task
        </Button>
        {isNewTask && (
          <Menu>
            <Menu.Target>
              <ActionIcon
                variant="filled"
                color="blue"
                size="lg"
                aria-label="Save options"
                data-testid={`save-options-${tabName}`}
              >
                <IconChevronDown size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                onClick={handleSaveAndCreateAnother}
                data-testid={`save-and-create-another-${tabName}`}
              >
                Save and create another
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </ButtonGroup>
    </Group>
  );

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <FocusTrap>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb={10}>
            <Tabs.Tab value="basics">
              <Text size="sm" className={clsx(basicsHasErrors ? sharedStyle.hasErrors : null)}>
                Basics
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="advanced">
              <Text
                size="sm"
                className={clsx(
                  advancedHasErrors ? sharedStyle.hasErrors : null,
                  advancedHasData ? sharedStyle.hasData : null
                )}
              >
                Advanced
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="notes">
              <Text size="sm" className={clsx(notesHasData ? sharedStyle.hasData : null)}>
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

              {saveButton('basics')}
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
                        label: pluralizeInterval ? 'Day' : 'Days',
                      },
                      {
                        value: 'weekly',
                        label: pluralizeInterval ? 'Week' : 'Weeks',
                      },
                      {
                        value: 'monthly',
                        label: pluralizeInterval ? 'Month' : 'Months',
                      },
                      {
                        value: 'yearly',
                        label: pluralizeInterval ? 'Year' : 'Years',
                      },
                    ]}
                    {...form.getInputProps('recurrence.frequency')}
                  />
                </SimpleGrid>

                <Box hidden={form.values.recurrence?.frequency !== 'weekly'} mt={10}>
                  <Flex>
                    <Chip.Group
                      {...form.getInputProps('recurrence.dayOfWeek', { type: 'checkbox' })}
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

              {saveButton('advanced')}
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
        <Text size="sm" c="red" pt={20}>
          {Object.keys(form.errors).length ? 'Fix errors to continue' : null}
        </Text>
      </FocusTrap>
    </form>
  );
}
