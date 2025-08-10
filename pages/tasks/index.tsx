import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Group } from '@mantine/core';
import ContextModifier from '@/components/Contexts/ContextModifier';
import ColumnSelector from '@/components/Tasks/ColumnSelector';
import FilterSelector from '@/components/Tasks/FilterSelector';
import StatusSelector from '@/components/Tasks/StatusSelector';
import TasksList from '@/components/Tasks/TasksList';
import TasksTable from '@/components/Tasks/TasksTable';
import ViewTypeSelector from '@/components/Tasks/ViewTypeSelector';
import {
  useContextRepository,
  useDataSource,
  usePreferencesRepository,
  useTaskRepository,
} from '@/contexts/DataSourceContext';
import { Context } from '@/data/documentTypes/Context';
import { Task, TaskFilter, TaskStatus, TaskWithUrgency } from '@/data/documentTypes/Task';
import { Notifications } from '@/helpers/Notifications';
import { UrgencyCalculator } from '@/helpers/UrgencyCalculator';

export default function Page() {
  const router = useRouter();
  const dataSource = useDataSource();
  const preferencesRepository = usePreferencesRepository();
  const taskRepository = useTaskRepository();
  const contextRepository = useContextRepository();
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'Active',
    'Tags',
    'Project',
    'Priority',
    'Due Date',
  ]);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>({});
  const [context, setContext] = useState<Context | null>(null);

  const [tasks, setTasks] = useState<TaskWithUrgency[]>([]);
  const [status, setStatus] = useState('pending');
  const [view, setView] = useState<'list' | 'table'>('table');

  const sortTasks = async (tasks: Task[]): Promise<TaskWithUrgency[]> => {
    const tasksWithUrgency = await augmentTasksWithUrgency(tasks);

    if (status === 'completed' || status === 'cancelled') {
      // sort by updatedAt desc
      return tasksWithUrgency.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    // sort by task urgency
    return tasksWithUrgency.sort((a, b) => b.urgency - a.urgency);
  };

  const augmentTasksWithUrgency = async (tasks: Task[]): Promise<TaskWithUrgency[]> => {
    const preferences = await preferencesRepository.getPreferences();
    const calculator = new UrgencyCalculator(preferences);
    return tasks.map((task) => ({
      ...task,
      urgency: calculator.getUrgency(task),
    }));
  };

  // If there is a context in the URL, fetch it and set the task filter
  useEffect(() => {
    if (router.query.context) {
      const fetchContext = async () => {
        try {
          const contextName = router.query.context as string;
          const context = await contextRepository.getContext(contextName);
          setTaskFilter(context.filter);
          setContext(context);
        } catch {
          Notifications.showError({
            title: 'Error',
            message: 'Unable to load context',
          });
        }
      };
      fetchContext();
    } else {
      setContext(null);
      setTaskFilter({});
    }
  }, [router.query]);

  // Subscribe to tasks based on the current status and task filter
  useEffect(() => {
    let statuses: TaskStatus[] = [];
    if (status === 'pending') {
      statuses = [TaskStatus.Ready, TaskStatus.Started];
    } else if (status === 'completed') {
      statuses = [TaskStatus.Done];
    } else if (status === 'cancelled') {
      statuses = [TaskStatus.Cancelled];
    } else if (status === 'waiting') {
      statuses = [TaskStatus.Waiting];
    } else if (status === 'recurring') {
      statuses = [TaskStatus.Recurring];
    }

    // subscribe to tasks and return unsubscribe handler
    return taskRepository.subscribeToTasks(
      {
        statuses,
        ...taskFilter,
      },
      async (tasks) => setTasks(await sortTasks(tasks))
    );
  }, [status, taskFilter]);

  // Load any default visible columns and view from local settings
  useEffect(() => {
    const setDefaults = async () => {
      const localSettings = await dataSource.getLocalSettings();
      if (localSettings.visibleTaskColumns && localSettings.visibleTaskColumns.length > 0) {
        setVisibleColumns(localSettings.visibleTaskColumns);
      }
      if (localSettings.defaultView) {
        setView(localSettings.defaultView);
      }
    };
    setDefaults();
  }, []);

  const updateColumnVisibility = async (columns: string[]) => {
    setVisibleColumns(columns);
    const localSettings = await dataSource.getLocalSettings();
    localSettings.visibleTaskColumns = columns;
    await dataSource.setLocalSettings(localSettings);
  };

  const updateView = async (newView: 'list' | 'table') => {
    setView(newView);
    const localSettings = await dataSource.getLocalSettings();
    localSettings.defaultView = newView;
    await dataSource.setLocalSettings(localSettings);
  };

  const viewComponent =
    view === 'table' ? (
      <TasksTable
        visibleColumns={visibleColumns}
        tasks={tasks}
        tasksAreCompletedOrCancelled={status === 'completed' || status === 'cancelled'}
        tasksAreRecurring={status === 'recurring'}
      />
    ) : (
      <TasksList tasks={tasks} />
    );

  return (
    <>
      <Group justify="space-between" gap="xs">
        <Group gap="xs">
          <StatusSelector setStatus={setStatus} status={status} />
          <ViewTypeSelector view={view} setView={updateView} />
        </Group>

        <Group gap="xs">
          {context && <ContextModifier context={context} />}
          <FilterSelector
            {...taskFilter}
            setTaskFilter={setTaskFilter}
            key={JSON.stringify(taskFilter)}
          />

          {view === 'table' && (
            <ColumnSelector
              choices={[
                'Active',
                'Description',
                'Tags',
                'Project',
                'Priority',
                'Due Date',
                'Age',
                'Urgency',
                '-',
                'Bulk Editor',
              ]}
              selected={visibleColumns}
              onChange={updateColumnVisibility}
            />
          )}
        </Group>
      </Group>
      {viewComponent}
    </>
  );
}
