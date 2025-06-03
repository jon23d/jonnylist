import React, { useEffect, useState } from 'react';
import { Group } from '@mantine/core';
import Board from '@/components/Contexts/Views/Board/Board';
import Calendar from '@/components/Contexts/Views/Calendar/Calendar';
import List from '@/components/Contexts/Views/List/List';
import { ViewProps } from '@/components/Contexts/Views/viewProps';
import ViewSelector, { ViewType } from '@/components/Contexts/Views/ViewSelector';
import TaskStatusSelector from '@/components/Tasks/TaskStatusSelector';
import { useDataSource } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/logger';

const views: Record<ViewType, (props: ViewProps) => React.ReactElement> = {
  List,
  Board,
  Calendar,
};

export default function ContextPage({ contextName }: { contextName: string }) {
  const datasource = useDataSource();
  const [currentView, setCurrentView] = useState<ViewType>('List');
  const [selectedTaskStatuses, setSelectedTaskStatuses] = useState<TaskStatus[]>([
    TaskStatus.Ready,
  ]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const unsubscribe = datasource.subscribeToTasks(
      {
        statuses: selectedTaskStatuses,
        context: contextName,
      },
      setTasks
    );

    // Record the last selected context in preferences
    datasource
      .getPreferences()
      .then((preferences) => {
        preferences.lastSelectedContext = contextName;
        return datasource.setPreferences(preferences);
      })
      .catch((error) => {
        Logger.error('Error setting last selected context:', error);
      });

    return () => {
      unsubscribe();
    };
  }, [selectedTaskStatuses, contextName]);

  const SelectedView = views[currentView];

  return (
    <>
      <Group justify="space-between">
        <ViewSelector value={currentView} onChange={setCurrentView} />
        <TaskStatusSelector value={selectedTaskStatuses} onChange={setSelectedTaskStatuses} />
      </Group>
      <h1>{contextName} Context</h1>
      <SelectedView tasks={tasks} />
    </>
  );
}
