import {
  Button,
  FocusTrap,
  Select,
  Stack,
  Tabs,
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

export default function EditTaskForm({
  task,
  handleClose,
}: {
  task: Task;
  handleClose: () => void;
}) {
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
      waitUntil: task.waitUntil,
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
        <Tabs defaultValue="basics">
          <Tabs.List mb={10}>
            <Tabs.Tab value="basics">Basics</Tabs.Tab>
            <Tabs.Tab value="advanced">Advanced</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="basics">
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
              <DateInput label="Due Date" {...form.getInputProps('dueDate')} clearable />

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

          <Tabs.Panel value="advanced">
            <Stack gap="xs">
              <Textarea
                label="Description"
                autosize
                minRows={3}
                {...form.getInputProps('description')}
              />

              <DateInput
                label="Wait Until"
                description="On this date, the task will be moved from waiting to pending"
                {...form.getInputProps('waitUntil')}
                clearable
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
