import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from '@mantine/form';
import TaskForm, { TaskFormType } from '@/components/Tasks/TaskForm';
import { useContextRepository, useTaskRepository } from '@/contexts/DataSourceContext';
import { NewTask, Recurrence, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';
import { Notifications } from '@/helpers/Notifications';

export default function NewTaskForm({ handleClose }: { handleClose: () => void }) {
  const [searchParams] = useSearchParams();
  const contextRepository = useContextRepository();
  const taskRepository = useTaskRepository();

  const queryContext = searchParams.get('context');

  const form = useForm<TaskFormType>({
    initialValues: {
      title: '',
      description: '',
      tags: [],
      project: '',
      priority: undefined,
      dueDate: undefined,
      waitUntil: undefined,
      isRecurring: false,
      recurrence: {
        // Default recurrence object in case the user enables recurrence
        frequency: 'daily',
        interval: 1,
        dayOfWeek: new Date().getDay(),
        dayOfMonth: new Date().getDate(),
        ends: {
          afterOccurrences: undefined,
          onDate: undefined,
        },
        yearlyFirstOccurrence: new Date().toISOString().split('T')[0], // Default to today
      },
      recurrenceEndsValue: 'never',
      notes: [],
      status: TaskStatus.Ready,
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

  useEffect(() => {
    // If a context is set, we may be able to grab some data from it
    if (queryContext) {
      contextRepository.getContext(queryContext).then((context) => {
        if (context?.filter.requireProjects && context.filter.requireProjects.length === 1) {
          form.setFieldValue('project', context.filter.requireProjects[0]);
        }
        if (context?.filter.requireTags) {
          form.setFieldValue('tags', context.filter.requireTags);
        }
      });
    }
  }, [queryContext]);

  const saveTask = async () => {
    let status = form.values.status;

    // Clean up the recurrence object to remove unused values
    let recurrence: Recurrence | undefined;

    if (form.values.isRecurring) {
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

      recurrence.dayOfWeek = recurrence.dayOfWeek ? Number(recurrence.dayOfWeek) : undefined;
      recurrence.dayOfMonth = recurrence.dayOfMonth ? Number(recurrence.dayOfMonth) : undefined;
    } else {
      recurrence = undefined;
    }

    const newTask: NewTask = {
      ...form.getValues(),
      recurrence,
      status,
    };

    await taskRepository.addTask(newTask);

    Notifications.showQuickSuccess('Task added');

    form.reset();

    // We want to make sure that we've cleared focus so that keyboard navigation works properly
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleSave = async () => {
    try {
      await saveTask();
      handleClose();
    } catch (error) {
      Notifications.showError({
        title: 'Error saving task',
        message: 'There was an error while saving the task. Please try again.',
      });
      Logger.error('Error saving task:', error);
    }
  };

  const handleSaveAndCreateAnother = async () => {
    try {
      await saveTask();
    } catch (error) {
      Notifications.showError({
        title: 'Error saving task',
        message: 'There was an error while saving the task. Please try again.',
      });
      Logger.error('Error saving task:', error);
    }
  };

  return (
    <TaskForm
      form={form}
      handleSubmit={handleSave}
      handleSaveAndCreateAnother={handleSaveAndCreateAnother}
      isNewTask
    />
  );
}
