import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Group } from '@mantine/core';
import ColumnSelector from '@/components/Tasks/ColumnSelector';
import FilterSelector from '@/components/Tasks/FilterSelector';
import StatusSelector from '@/components/Tasks/StatusSelector';
import TasksList from '@/components/Tasks/TasksList';
import TasksTable from '@/components/Tasks/TasksTable';
import ViewTypeSelector from '@/components/Tasks/ViewTypeSelector';
import {
  useContextRepository,
  useDataSource,
  useTaskRepository,
} from '@/contexts/DataSourceContext';
import { Task, TaskFilter, TaskStatus } from '@/data/documentTypes/Task';
import { Notifications } from '@/helpers/Notifications';

export default function Page() {
  const [searchParams, _] = useSearchParams();
  const dataSource = useDataSource();
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

  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState('pending');
  const [view, setView] = useState<'list' | 'table'>('table');

  const querystringContext = searchParams.get('context');

  const sortTasks = (tasks: Task[]): Task[] => {
    if (status === 'completed' || status === 'cancelled') {
      // sort by updatedAt desc
      return tasks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    // Use the default sort order for other statuses
    return tasks;
  };

  // If there is a context in the URL, fetch it and set the task filter
  useEffect(() => {
    if (querystringContext) {
      const fetchContext = async () => {
        try {
          const context = await contextRepository.getContext(querystringContext);
          setTaskFilter(context.filter);
        } catch {
          Notifications.showError({
            title: 'Error',
            message: 'Unable to load context',
          });
        }
      };
      fetchContext();
    } else {
      setTaskFilter({});
    }
  }, [querystringContext]);

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
      async (tasks) => setTasks(sortTasks(tasks))
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
      <Group justify="space-between" gap="xs" mb="1em">
        <Group gap="xs">
          <StatusSelector setStatus={setStatus} status={status} />
          <ViewTypeSelector view={view} setView={updateView} />
        </Group>

        <Group gap="xs">
          <FilterSelector
            {...taskFilter}
            setTaskFilter={setTaskFilter}
            key={JSON.stringify(taskFilter)}
          />

          {view === 'table' && (
            <ColumnSelector
              choices={[
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
