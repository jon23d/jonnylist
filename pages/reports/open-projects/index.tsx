import React, { useEffect, useState } from 'react';
import { Group, Tabs, Title } from '@mantine/core';
import ColumnSelector from '@/components/Tasks/ColumnSelector';
import TasksTable from '@/components/Tasks/TasksTable';
import {
  useDataSource,
  usePreferencesRepository,
  useTaskRepository,
} from '@/contexts/DataSourceContext';
import { Task, TaskStatus, TaskWithUrgency } from '@/data/documentTypes/Task';
import { UrgencyCalculator } from '@/helpers/UrgencyCalculator';

export default function Page() {
  const dataSource = useDataSource();
  const preferencesRepository = usePreferencesRepository();
  const taskRepository = useTaskRepository();
  const [groupedTasks, setGroupedTasks] = useState<Record<string, TaskWithUrgency[]>>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'Active',
    'Tags',
    'Project',
    'Priority',
    'Due Date',
  ]);

  const filterTasks = (tasks: Task[]): Task[] => {
    return tasks.filter((task) => !!task.project);
  };

  const sortTasks = async (tasks: Task[]): Promise<TaskWithUrgency[]> => {
    const tasksWithUrgency = await augmentTasksWithUrgency(tasks);
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

  // Subscribe to all non-closed tasks with a project
  useEffect(() => {
    const unsubscribe = taskRepository.subscribeToTasks(
      {
        statuses: [TaskStatus.Started, TaskStatus.Ready, TaskStatus.Waiting],
      },
      groupTasksByProject
    );
    return unsubscribe;
  }, []);

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

  const groupTasksByProject = async (tasks: Task[]) => {
    const filteredTasks = filterTasks(tasks);
    const sortedTasks = await sortTasks(filteredTasks);

    const grouped = sortedTasks.reduce(
      (acc, task) => {
        if (task.project) {
          if (!acc[task.project]) {
            acc[task.project] = [];
          }
          acc[task.project].push(task);
        }
        return acc;
      },
      {} as Record<string, TaskWithUrgency[]>
    );

    setGroupedTasks(grouped);
  };

  if (!Object.keys(groupedTasks).length) {
    return (
      <Title order={3} mt="xl">
        No projects with open tasks found.
      </Title>
    );
  }

  return (
    <>
      <Group justify="space-between">
        <Title order={2} mb="md">
          Projects With Open Tasks
        </Title>
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
      <Tabs defaultValue={Object.keys(groupedTasks)[0]}>
        <Tabs.List>
          {Object.entries(groupedTasks).map(([project, tasks]) => (
            <Tabs.Tab key={project} value={project}>
              {project} ({tasks.length})
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {Object.entries(groupedTasks).map(([project, projectTasks]) => (
          <Tabs.Panel value={project} key={project} mt={20}>
            <TasksTable
              visibleColumns={visibleColumns}
              tasks={projectTasks}
              tasksAreCompletedOrCancelled={false}
            />
          </Tabs.Panel>
        ))}
      </Tabs>
    </>
  );
}
