import { useEffect, useState } from 'react';
import { Button, FocusTrap, NumberInput, Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDataSource } from '@/contexts/DataSourceContext';
import { createDefaultPreferences } from '@/data/documentTypes/Preferences';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/logger';

export default function NewTaskForm() {
  const dataSource = useDataSource();
  const [contexts, setContexts] = useState<string[]>([]);

  const form = useForm<Partial<Task>>({
    mode: 'uncontrolled',
    initialValues: {
      context: '',
      type: 'task',
      title: '',
      description: '',
      priority: 1,
      dueDate: undefined,
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
      Logger.info('Got contexts:', availableContexts);
      Logger.info('Last selected context:', lastSelectedContext);
      form.setFieldValue('context', lastSelectedContext);
    };
    initializeForm();
  }, []);

  const handleSave = async (values: Partial<Task>) => {
    try {
      // Ensure the context is set
      if (!values.context) {
        throw new Error('Context is required');
      }

      // Create a new task object
      const _newTask: Partial<Task> = {
        ...values,
        _id: `task-${Date.now()}`, // Generate a unique ID
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.Ready,
      };

      // Save the task to the data source
      //await dataSource.addTask(newTask);

      // Optionally, reset the form or close the modal
      //form.reset();
    } catch (error) {
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

      <Button type="submit">Save</Button>
      <Button type="button" onClick={() => form.reset()} variant="outline">
        Reset
      </Button>
    </form>
  );
}
