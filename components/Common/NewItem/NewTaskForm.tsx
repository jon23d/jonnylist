import { useEffect, useState } from 'react';
import { Button, NumberInput, Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDataSource } from '@/contexts/DataSourceContext';
import { createDefaultPreferences } from '@/data/documentTypes/Preferences';
import { NewTask, TaskStatus, taskStatusSelectOptions } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/logger';

export default function NewTaskForm({ handleClose }: { handleClose: () => void }) {
  const dataSource = useDataSource();
  const [contexts, setContexts] = useState<string[]>([]);

  const form = useForm<NewTask>({
    mode: 'uncontrolled',
    initialValues: {
      context: '',
      title: '',
      description: '',
      priority: 1,
      dueDate: undefined,
      status: TaskStatus.Ready,
    },
  });

  useEffect(() => {
    const initializeForm = async () => {
      const [availableContexts, { lastSelectedContext }] = await Promise.all([
        dataSource.getContexts().catch((err) => {
          Logger.error('Error fetching contexts:', err);
          return [] as string[];
        }),
        dataSource.getPreferences().catch((err) => {
          Logger.error('Error fetching preferences:', err);
          return createDefaultPreferences();
        }),
      ]);

      setContexts(availableContexts);

      // @TODO WTF make this work
      form.setFieldValue('context', lastSelectedContext);
    };
    initializeForm();
  }, []);

  const handleSave = async () => {
    try {
      const newTask: NewTask = {
        ...form.getValues(),
      };

      await dataSource.addTask(newTask);

      form.reset();
      handleClose();
    } catch (error) {
      // @TODO handle error properly
      Logger.error('Error saving task:', error);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSave)}>
      <Select
        label="Context"
        placeholder="Select a context"
        data={contexts.map((context) => ({ value: context, label: context }))}
        {...form.getInputProps('context')}
        key="context"
        required
      />
      <TextInput label="Title" placeholder="Task title" {...form.getInputProps('title')} required />
      <TextInput
        label="Description"
        placeholder="Task description"
        {...form.getInputProps('description')}
      />
      <NumberInput
        label="Priority"
        placeholder="1 (low) to 5 (high)"
        min={1}
        max={5}
        {...form.getInputProps('priority')}
      />
      <DateInput
        label="Due Date"
        placeholder="Select a due date"
        {...form.getInputProps('dueDate')}
        clearable
      />
      <Select
        label="Status"
        placeholder="Select task status"
        data={taskStatusSelectOptions}
        {...form.getInputProps('status')}
      />

      <Button type="submit">Save</Button>
      <Button type="button" onClick={() => form.reset()} variant="outline">
        Reset
      </Button>
    </form>
  );
}
