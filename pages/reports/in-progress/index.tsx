import React, { useEffect, useState } from 'react';
import { Group, Title } from '@mantine/core';
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
  const [tasks, setTasks] = useState<TaskWithUrgency[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'Active',
    'Tags',
    'Project',
    'Priority',
    'Due Date',
  ]);

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

  // Subscribe to in-progress tasks
  useEffect(() => {
    const unsubscribe = taskRepository.subscribeToTasks(
      {
        statuses: [TaskStatus.Started],
      },
      async (tasks) => setTasks(await sortTasks(tasks))
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

  return (
    <>
      <Group justify="space-between">
        <Title order={2} mb="md">
          In-Progress Tasks
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
      <TasksTable
        visibleColumns={visibleColumns}
        tasks={tasks}
        tasksAreCompletedOrCancelled={false}
      />
    </>
  );
}
