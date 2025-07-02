import React, { useEffect, useState } from 'react';
import { Group, Title } from '@mantine/core';
import Board from '@/components/Contexts/Views/Board/Board';
import Calendar from '@/components/Contexts/Views/Calendar/Calendar';
import List from '@/components/Contexts/Views/List/List';
import { ViewProps } from '@/components/Contexts/Views/viewProps';
import ViewSelector, { ViewType } from '@/components/Contexts/Views/ViewSelector';
import TaskStatusSelector from '@/components/Tasks/TaskStatusSelector';
import { useDataSource } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';

const views: Record<ViewType, (props: ViewProps) => React.ReactElement> = {
  List,
  Board,
  Calendar,
};

export default function ContextPage({ contextName }: { contextName: string }) {
  const datasource = useDataSource();
  const [currentView, setCurrentView] = useState<ViewType>('List');
  const [selectedTaskStatuses, setSelectedTaskStatuses] = useState<TaskStatus[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load saved statuses on mount, then subscribe to tasks
  useEffect(() => {
    datasource
      .getPreferences()
      .then((preferences) => {
        const savedStatuses = preferences.lastSelectedStatuses || [TaskStatus.Ready];
        setSelectedTaskStatuses(savedStatuses);
      })
      .catch((error) => {
        Logger.error('Error loading preferences:', error);
        setSelectedTaskStatuses([TaskStatus.Ready]);
      });
  }, []);

  useEffect(() => {
    if (selectedTaskStatuses.length === 0) {
      return;
    }

    const unsubscribe = datasource.subscribeToTasks(
      {
        statuses: selectedTaskStatuses,
        context: contextName,
      },
      setTasks
    );

    // Update preferences
    datasource
      .getPreferences()
      .then((preferences) => {
        preferences.lastSelectedContext = contextName;
        preferences.lastSelectedStatuses = selectedTaskStatuses;
        return datasource.setPreferences(preferences);
      })
      .catch((error) => {
        Logger.error('Error updating preferences:', error);
      });

    return () => {
      unsubscribe();
    };
  }, [selectedTaskStatuses, contextName]);

  const SelectedView = views[currentView];

  return (
    <>
      <Group justify="space-between" mb={10}>
        <ViewSelector value={currentView} onChange={setCurrentView} />
        <TaskStatusSelector value={selectedTaskStatuses} onChange={setSelectedTaskStatuses} />
      </Group>
      <Title order={1} mb={10}>
        {contextName}
      </Title>
      <SelectedView tasks={tasks} visibleStatuses={selectedTaskStatuses} />
    </>
  );
}
