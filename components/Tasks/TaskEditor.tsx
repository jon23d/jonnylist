import { useEffect, useState } from 'react';
import { Button, FocusTrap, Select, Stack, TagsInput, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useContextRepository, useTaskRepository } from '@/contexts/DataSourceContext';
import {
  Task,
  taskPrioritySelectOptions,
  taskStatusSelectOptions,
} from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';

export default function TaskEditor({ task, handleClose }: { task: Task; handleClose: () => void }) {
  const contextRepository = useContextRepository();
  const taskRepository = useTaskRepository();

  const [contexts, setContexts] = useState<string[]>([]);

  const form = useForm<Partial<Task>>({
    mode: 'uncontrolled',
    initialValues: {
      context: task.context,
      title: task.title,
      description: task.description,
      tags: task.tags,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
    },
    validate: {
      title: (value) => (value ? null : 'Title is required'),
      context: (value) => (value ? null : 'Context is required'),
      status: (value) => (value ? null : 'Status is required'),
    },
  });

  useEffect(() => {
    const initializeForm = async () => {
      const [availableContexts] = await Promise.all([
        contextRepository.getContexts().catch((err) => {
          Logger.error('Error fetching contexts:', err);
          return [] as string[];
        }),
      ]);

      setContexts(availableContexts);
    };
    initializeForm();
  }, []);

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

  return (
    <form onSubmit={form.onSubmit(handleSave)}>
      <FocusTrap>
        <Stack>
          <Select
            label="Context"
            placeholder="Select a context"
            data={contexts.map((context) => ({ value: context, label: context }))}
            {...form.getInputProps('context')}
            key="context"
            withAsterisk
          />
          <TextInput
            label="Title"
            placeholder="Task title"
            {...form.getInputProps('title')}
            withAsterisk
          />
          <Select
            label="Status"
            placeholder="Select task status"
            data={taskStatusSelectOptions}
            {...form.getInputProps('status')}
            data-autofocus
            clearable={false}
            allowDeselect={false}
            withAsterisk
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
            clearable
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
          <Button type="button" onClick={handleClose} variant="outline">
            Cancel
          </Button>
        </Stack>
      </FocusTrap>
    </form>
  );
}
