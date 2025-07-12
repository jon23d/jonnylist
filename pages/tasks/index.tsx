import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Group, SegmentedControl } from '@mantine/core';
import ContextModifier from '@/components/Contexts/ContextModifier';
import ColumnSelector from '@/components/Tasks/ColumnSelector';
import FilterSelector from '@/components/Tasks/FilterSelector';
import TasksTable from '@/components/Tasks/TasksTable';
import {
  useContextRepository,
  useDataSource,
  useTaskRepository,
} from '@/contexts/DataSourceContext';
import { Context } from '@/data/documentTypes/Context';
import { Task, TaskFilter, TaskStatus } from '@/data/documentTypes/Task';
import { Notifications } from '@/helpers/Notifications';
import { getUrgency } from '@/helpers/Tasks';

export default function Page() {
  const router = useRouter();
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
  const [context, setContext] = useState<Context | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState('pending');

  const filterTasks = (tasks: Task[]): Task[] => {
    return tasks.filter((task) => {
      // filter by tags
      const includesTags = taskFilter.requireTags?.length
        ? taskFilter.requireTags.some((tag) => task.tags?.includes(tag))
        : true;
      const excludesTags = taskFilter.excludeTags?.length
        ? !taskFilter.excludeTags.some((tag) => task.tags?.includes(tag))
        : true;

      // filter by projects. Projects are hierarchical, separated by dots,
      // so we will look for projects that start with what is provided
      // in the filter. This allows for filtering by parent projects as well.
      let includesProjects = !taskFilter.requireProjects?.length;
      if (taskFilter.requireProjects?.length && task.project) {
        for (const project of taskFilter.requireProjects) {
          if (task.project.startsWith(project)) {
            includesProjects = true;
            break;
          }
        }
      }
      let excludesProjects = true;
      if (taskFilter.excludeProjects?.length && task.project) {
        for (const project of taskFilter.excludeProjects) {
          if (task.project.startsWith(project)) {
            excludesProjects = false;
            break;
          }
        }
      }

      // Filter by status
      const includesPriority = taskFilter.requirePriority?.length
        ? taskFilter.requirePriority.some((priority) => priority === task.priority)
        : true;
      const excludesPriority = taskFilter.excludePriority?.length
        ? !taskFilter.excludePriority.some((priority) => priority === task.priority)
        : true;

      return (
        includesTags &&
        excludesTags &&
        includesProjects &&
        excludesProjects &&
        includesPriority &&
        excludesPriority
      );
    });
  };

  const sortTasks = (tasks: Task[]): Task[] => {
    if (status === 'completed' || status === 'cancelled') {
      // sort by updatedAt desc
      return tasks.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    // sort by task urgency
    return tasks.sort((a, b) => getUrgency(b) - getUrgency(a));
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
    }

    // subscribe to tasks
    const unsubscribe = taskRepository.subscribeToTasks(
      {
        statuses,
      },
      (tasks) => setTasks(filterTasks(sortTasks(tasks)))
    );

    return unsubscribe;
  }, [status, taskFilter]);

  // Load any default visible columns from local settings
  useEffect(() => {
    const setColumnVisibility = async () => {
      const localSettings = await dataSource.getLocalSettings();
      if (localSettings.visibleTaskColumns && localSettings.visibleTaskColumns.length > 0) {
        setVisibleColumns(localSettings.visibleTaskColumns);
      }
    };
    setColumnVisibility();
  }, []);

  const updateColumnVisibility = async (columns: string[]) => {
    setVisibleColumns(columns);
    const localSettings = await dataSource.getLocalSettings();
    localSettings.visibleTaskColumns = columns;
    await dataSource.setLocalSettings(localSettings);
  };

  return (
    <>
      <Group justify="space-between">
        <SegmentedControl
          data={['pending', 'completed', 'cancelled', 'recurring', 'waiting']}
          value={status}
          onChange={setStatus}
        />
        <Group>
          {context && <ContextModifier context={context} />}
          <FilterSelector
            {...taskFilter}
            setTaskFilter={setTaskFilter}
            key={JSON.stringify(taskFilter)}
          />

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
            ]}
            selected={visibleColumns}
            onChange={updateColumnVisibility}
          />
        </Group>
      </Group>
      <TasksTable
        visibleColumns={visibleColumns}
        tasks={tasks}
        tasksAreCompletedOrCancelled={status === 'completed' || status === 'cancelled'}
      />
    </>
  );
}
