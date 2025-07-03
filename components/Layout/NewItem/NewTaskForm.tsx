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
  taskPrioritySelectOptions,
  TaskStatus,
  taskStatusSelectOptions,
} from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';

export default function NewTaskForm({ handleClose }: { handleClose: () => void }) {
  const taskRepository = useTaskRepository();

  const form = useForm<NewTask>({
    mode: 'uncontrolled',
    initialValues: {
      title: '',
      description: '',
      tags: [],
      project: '',
      priority: undefined,
      dueDate: undefined,
      status: TaskStatus.Ready,
    },
    validate: {
      title: (value) => (value ? null : 'Title is required'),
      status: (value) => (value ? null : 'Status is required'),
    },
  });

  const handleSave = async () => {
    try {
      const newTask: NewTask = {
        ...form.getValues(),
      };

      await taskRepository.addTask(newTask);

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
      <Stack gap="xs">
        <FocusTrap>
          <TextInput label="Title" {...form.getInputProps('title')} withAsterisk data-autofocus />

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
              data={taskPrioritySelectOptions}
              {...form.getInputProps('priority')}
              size="xs"
            />
            <DateInput label="Due Date" {...form.getInputProps('dueDate')} clearable size="xs" />
          </Group>

          <Group justify="space-between" grow>
            <Select
              label="Status"
              data={taskStatusSelectOptions}
              {...form.getInputProps('status')}
              withAsterisk
              allowDeselect={false}
              size="xs"
            />
          </Group>

          <Button type="submit">Save</Button>
        </FocusTrap>
      </Stack>
    </form>
  );
}
