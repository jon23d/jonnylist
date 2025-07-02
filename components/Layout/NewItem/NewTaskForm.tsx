import { useEffect, useState } from 'react';
import { Button, FocusTrap, Select, Stack, TagsInput, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDataSource } from '@/contexts/DataSourceContext';
import {
  NewTask,
  taskPrioritySelectOptions,
  TaskStatus,
  taskStatusSelectOptions,
} from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';

export default function NewTaskForm({ handleClose }: { handleClose: () => void }) {
  const dataSource = useDataSource();
  // use to force an update of the contexts dropdown
  const [contextKey, setContextKey] = useState<number>(0);
  const [contexts, setContexts] = useState<string[]>([]);

  const form = useForm<NewTask>({
    mode: 'uncontrolled',
    initialValues: {
      context: '',
      title: '',
      description: '',
      tags: [],
      priority: undefined,
      dueDate: undefined,
      status: TaskStatus.Ready,
    },
    validate: {
      title: (value) => (value ? null : 'Title is required'),
      context: (value) => (value ? null : 'Context is required'),
      status: (value) => (value ? null : 'Status is required'),
    },
  });

  useEffect(() => {
    const initialize = async () => {
      const [contexts, preferences] = await Promise.all([
        dataSource.getContexts(),
        dataSource.getPreferences(),
      ]);

      setContexts(contexts);
      form.setFieldValue('context', preferences.lastSelectedContext);
      setContextKey((prev) => prev + 1);
    };
    initialize();
  }, []);

  const handleSave = async () => {
    try {
      const newTask: NewTask = {
        ...form.getValues(),
      };

      await dataSource.addTask(newTask);

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

  return (
    <form onSubmit={form.onSubmit(handleSave)}>
      <Stack>
        <FocusTrap>
          <Select
            label="Context"
            placeholder="Select a context"
            data={contexts}
            {...form.getInputProps('context')}
            key={`context-${contextKey}`} // Force re-render when contexts change
            withAsterisk
          />
          <TextInput
            label="Title"
            placeholder="Task title"
            {...form.getInputProps('title')}
            withAsterisk
            data-autofocus
          />
          <Select
            label="Status"
            placeholder="Select task status"
            data={taskStatusSelectOptions}
            {...form.getInputProps('status')}
            withAsterisk
            allowDeselect={false}
          />
          <TextInput
            label="Description"
            placeholder="Task description"
            {...form.getInputProps('description')}
          />
          <TagsInput label="Tags" {...form.getInputProps('tags')} />
          <Select
            label="Priority"
            placeholder="Select relative priority"
            data={taskPrioritySelectOptions}
            {...form.getInputProps('priority')}
          />
          <DateInput
            label="Due Date"
            placeholder="Select a due date"
            {...form.getInputProps('dueDate')}
            clearable
          />

          <Button type="submit">Save</Button>
          <Button type="button" onClick={() => form.reset()} variant="outline">
            Reset
          </Button>
        </FocusTrap>
      </Stack>
    </form>
  );
}
