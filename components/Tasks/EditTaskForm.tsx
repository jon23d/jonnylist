import { useEffect, useRef, useState } from 'react';
import {
  Button,
  FocusTrap,
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

export default function EditTaskForm({
  task,
  handleClose,
}: {
  task: Task;
  handleClose: () => void;
}) {
  const taskRepository = useTaskRepository();
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

  const form = useForm<NewTask>({
    // NewTask is a task without metadata
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

  // If the advanced tab has data on it, we want for the user to be able to tell at a glance
  const advancedHasData = form.values.waitUntil || form.values.description;
  const hasDataProps = { fs: 'italic', fw: 600 };

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
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Button type="submit" mt={20}>
          Update Task
        </Button>
      </FocusTrap>
    </form>
  );
}
