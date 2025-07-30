import { Select, TagsInput, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { taskPrioritySelectOptions, taskStatusSelectOptions } from '@/data/documentTypes/Task';
import { datePickerPresets } from '@/helpers/datePicker';

export default function BulkEditor({ taskIds }: { taskIds: string[] }) {
  const form = useForm({
    initialValues: {
      priority: '',
      status: '',
      project: '',
      tags: [],
      waitUntil: undefined,
    },
  });

  return (
    <form>
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
        size="xs"
        searchable
      />
      <TagsInput label="Tags" {...form.getInputProps('tags')} />
      <TextInput label="Project" {...form.getInputProps('project')} />
      <DatePickerInput
        label="Wait Until"
        description="On this date, the task will be moved from waiting to pending"
        {...form.getInputProps('waitUntil')}
        clearable
        highlightToday
        presets={datePickerPresets}
      />
    </form>
  );
}
