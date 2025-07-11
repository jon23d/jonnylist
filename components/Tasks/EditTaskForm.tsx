import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  FocusTrap,
  Paper,
  ScrollArea,
  Select,
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
import { useTaskRepository } from '@/contexts/DataSourceContext';
import {
  NewTask,
  Task,
  taskPrioritySelectOptions,
  taskStatusSelectOptions,
} from '@/data/documentTypes/Task';
import { datePickerPresets } from '@/helpers/datePicker';
import { Logger } from '@/helpers/Logger';
import { Notifications } from '@/helpers/Notifications';

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

  const form = useForm<NewTask>({
    // NewTask is a task without metadata, INCLUDING notes. These are updated separately.
    mode: 'uncontrolled',
    initialValues: {
      title: task.title,
      description: task.description,
      tags: task.tags,
      project: task.project,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
      waitUntil: task.waitUntil,
    },
    validate: {
      title: (value) => (value ? null : 'Title is required'),
      status: (value) => (value ? null : 'Status is required'),
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
      await taskRepository.updateTask({
        ...task,
        ...form.getValues(),
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
