import { useForm } from '@mantine/form';
import TaskForm, { TaskFormType } from '@/components/Tasks/TaskForm';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import { Recurrence, Task, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';
import { Notifications } from '@/helpers/Notifications';

export default function EditTaskForm({
  task,
  handleClose,
}: {
  task: Task;
  handleClose: () => void;
}) {
  const taskRepository = useTaskRepository();

  const form = useForm<TaskFormType>({
    initialValues: {
      title: task.title,
      description: task.description,
      tags: task.tags,
      project: task.project,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
      waitUntil: task.waitUntil,
      notes: task.notes || [],
      isRecurring: !!task.recurrence?.frequency,
      recurrence: task.recurrence || {
        // Default recurrence object in case the user enables recurrence
        frequency: 'daily',
        interval: 1,
        dayOfWeek: new Date().getDay(),
        dayOfMonth: new Date().getDate(),
        ends: {
          afterOccurrences: undefined,
          onDate: undefined,
        },
        yearlyFirstOccurrence: new Date().toISOString().split('T')[0], // Default to today,
      },
      recurrenceEndsValue: task.recurrence?.ends?.onDate
        ? 'onDate'
        : task.recurrence?.ends?.afterOccurrences
          ? 'afterOccurrences'
          : 'never',
    },
    validate: {
      title: (value) => (value ? null : 'Title is required'),
      waitUntil: (value, values) => {
        if (value && values.isRecurring) {
          return 'Wait Until date cannot be set for recurring tasks';
        }
        return null;
      },
      status: (value, values) => {
        if (value === TaskStatus.Waiting && !values.waitUntil) {
          return 'Wait Until date is required for Waiting status';
        }
      },
      recurrence: (value) => {
        if (value?.frequency === 'weekly' && value.dayOfWeek === undefined) {
          return 'A day of the week is required for weekly recurrence';
        }
      },
    },
  });

  const handleSave = async () => {
    try {
      // Clean up the recurrence object to remove unused values
      let recurrence: Recurrence | undefined;
      let status: TaskStatus = form.values.waitUntil ? TaskStatus.Waiting : form.values.status;

      if (
        form.values.isRecurring &&
        status !== TaskStatus.Cancelled &&
        status !== TaskStatus.Done
      ) {
        recurrence = form.values.recurrence as Recurrence;
        status = TaskStatus.Recurring;

        if (recurrence.frequency !== 'weekly') {
          recurrence.dayOfWeek = undefined;
        }
        if (recurrence.frequency !== 'monthly') {
          recurrence.dayOfMonth = undefined;
        }
        if (recurrence.frequency !== 'yearly') {
          recurrence.yearlyFirstOccurrence = undefined;
        }

        recurrence.dayOfWeek =
          recurrence.dayOfWeek !== undefined ? Number(recurrence.dayOfWeek) : undefined;
        recurrence.dayOfMonth =
          recurrence.dayOfMonth !== undefined ? Number(recurrence.dayOfMonth) : undefined;
      } else {
        recurrence = undefined;
      }

      await taskRepository.updateTask({
        ...task,
        ...form.getValues(),
        status,
        recurrence,
      });

      Notifications.showQuickSuccess('Task updated');

      form.reset();

      // We want to make sure that we've cleared focus so that keyboard navigation works properly
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      handleClose();
    } catch (error) {
      Notifications.showError({
        title: 'Error saving task',
        message: 'There was an error while saving the task. Please try again.',
      });
      Logger.error('Error saving task:', error);
    }
  };

  return <TaskForm form={form} handleSubmit={handleSave} />;
}
