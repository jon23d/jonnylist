import { Button, Checkbox, Flex, Group, Select, TagsInput, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import {
  NewTask,
  Task,
  taskPrioritySelectOptions,
  TaskStatus,
  taskStatusSelectOptions,
} from '@/data/documentTypes/Task';
import { datePickerPresets } from '@/helpers/datePicker';
import { Notifications } from '@/helpers/Notifications';

export default function BulkEditor({
  tasks,
  onSave,
  onCancel,
}: {
  tasks: Task[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const taskRepository = useTaskRepository();

  const form = useForm<
    Partial<NewTask> & { clearProject: boolean; addTags: string[]; removeTags: string[] }
  >({
    initialValues: {
      priority: undefined,
      status: undefined,
      clearProject: false,
      project: '',
      addTags: [],
      removeTags: [],
      waitUntil: undefined,
    },
  });

  const handleSubmit = async () => {
    let payload: Partial<Task> = {};
    if (form.values.priority) {
      payload = { ...payload, priority: form.values.priority };
    }
    if (form.values.status) {
      payload = { ...payload, status: form.values.status };
    }
    if (form.values.clearProject) {
      payload = { ...payload, project: '' };
    } else if (form.values.project) {
      payload = { ...payload, project: form.values.project };
    }
    if (form.values.waitUntil) {
      payload = {
        ...payload,
        waitUntil: form.values.waitUntil,
        status: TaskStatus.Waiting,
      };
    }

    const updates = tasks.map((task: Task) => {
      let updatedTask = {
        ...task,
        ...payload,
      };

      updatedTask = {
        ...updatedTask,
        tags: [
          ...(updatedTask.tags || []).filter(
            (tag: string) => !form.values.removeTags.includes(tag)
          ),
          ...form.values.addTags,
        ],
      };

      return taskRepository.updateTask(updatedTask);
    });

    try {
      await Promise.all(updates);
      form.reset();
      onSave();
    } catch (error) {
      Notifications.showError({
        title: 'Unable to complete bulk update',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Select
        label="Priority"
        clearable
        data={taskPrioritySelectOptions}
        {...form.getInputProps('priority')}
        searchable
      />
      <Select
        label="Status"
        data={taskStatusSelectOptions}
        {...form.getInputProps('status')}
        clearable={false}
        allowDeselect={false}
        searchable
      />
      <TagsInput label="Add Tags" {...form.getInputProps('addTags')} />

      <TagsInput label="Remove Tags" {...form.getInputProps('removeTags')} />

      <Flex flex="auto">
        <TextInput
          label="Project"
          {...form.getInputProps('project')}
          flex={1}
          disabled={form.values.clearProject}
        />
        <Checkbox
          mt={30}
          ml={10}
          label="Clear project"
          {...form.getInputProps('clearProject', { type: 'checkbox' })}
        />
      </Flex>

      <DatePickerInput
        label="Wait Until"
        description="On this date, the task will be moved from waiting to pending"
        {...form.getInputProps('waitUntil')}
        clearable
        highlightToday
        presets={datePickerPresets}
      />

      <Group grow mt={10}>
        <Button type="submit">Update tasks</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </Group>
    </form>
  );
}
