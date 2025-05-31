import React, { ComponentType, useState } from 'react';
import { Group } from '@mantine/core';
import Board from '@/components/Contexts/Views/Board/Board';
import Calendar from '@/components/Contexts/Views/Calendar/Calendar';
import List from '@/components/Contexts/Views/List/List';
import ViewSelector, { ViewType } from '@/components/Contexts/Views/ViewSelector';
import TaskStatusSelector from '@/components/Tasks/TaskStatusSelector';
import { TaskStatus } from '@/data/DataSource';

const views: Record<ViewType, ComponentType> = {
  List,
  Board,
  Calendar,
};

export default function ContextPage({ contextName }: { contextName: string }) {
  const [currentView, setCurrentView] = useState<ViewType>('List');
  const [selectedTaskStatuses, setSelectedTaskStatuses] = useState<TaskStatus[]>([
    TaskStatus.Ready,
  ]);

  const SelectedView = views[currentView];

  return (
    <>
      <Group justify="space-between">
        <ViewSelector value={currentView} onChange={setCurrentView} />
        <TaskStatusSelector value={selectedTaskStatuses} onChange={setSelectedTaskStatuses} />
      </Group>
      <h1>{contextName} Context</h1>
      <SelectedView />
    </>
  );
}
