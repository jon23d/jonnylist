import { useEffect, useState } from 'react';
import { Button, FocusTrap, NumberInput, Select, Stack, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDataSource } from '@/contexts/DataSourceContext';
import { NewTask, TaskStatus, taskStatusSelectOptions } from '@/data/documentTypes/Task';
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
      sortOrder: 0,
      priority: 1,
      dueDate: undefined,
      status: TaskStatus.Ready,
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
            required
          />
          <TextInput
            label="Title"
            placeholder="Task title"
            {...form.getInputProps('title')}
            required
            data-autofocus
          />
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
        </FocusTrap>
      </Stack>
    </form>
  );
}
