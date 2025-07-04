import {
  Button,
  FocusTrap,
  Group,
  Select,
  Stack,
  TagsInput,
  Textarea,
  TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import {
  NewTask,
  Task,
  taskPrioritySelectOptions,
  taskStatusSelectOptions,
} from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';

export default function TaskEditor({ task, handleClose }: { task: Task; handleClose: () => void }) {
  const taskRepository = useTaskRepository();

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
    },
    validate: {
      title: (value) => (value ? null : 'Title is required'),
      status: (value) => (value ? null : 'Status is required'),
    },
  });

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
        <Stack gap="xs">
          <TextInput label="Title" {...form.getInputProps('title')} withAsterisk data-autoFocus />

          <Textarea
            label="Description"
            autosize
            minRows={3}
            size="xs"
            {...form.getInputProps('description')}
          />

          <Group justify="space-between" grow>
            <TagsInput label="Tags" {...form.getInputProps('tags')} size="xs" />
            <TextInput label="Project" {...form.getInputProps('project')} size="xs" />
          </Group>

          <Group justify="space-between" grow>
            <Select
              label="Priority"
              clearable
              data={taskPrioritySelectOptions}
              {...form.getInputProps('priority')}
              size="xs"
              searchable
            />
            <DateInput label="Due Date" {...form.getInputProps('dueDate')} clearable size="xs" />
          </Group>

          <Group justify="space-between" grow>
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
          </Group>

          <Button type="submit">Save</Button>
        </Stack>
      </FocusTrap>
    </form>
  );
}
