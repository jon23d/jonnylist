import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ContextModifier from '@/components/Contexts/ContextModifier';
import BulkEditor from '@/components/Tasks/BulkEditor';
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
  const [bulkEditorOpened, { close: closeBulkEditor, open: openBulkEditor }] = useDisclosure();
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState('pending');
  const [view, setView] = useState<'list' | 'table'>('table');

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
    } else if (status === 'recurring') {
      statuses = [TaskStatus.Recurring];
    }

    // subscribe to tasks and return unsubscribe handler
    return taskRepository.subscribeToTasks(
      {
        statuses,
        ...taskFilter,
      },
      (tasks) => setTasks(sortTasks(tasks))
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

  const showBulkEditDialog = (taskIds: string[]) => {
    if (taskIds.length === 0) {
      Notifications.showError({
        title: 'Error',
        message: 'No tasks selected for bulk edit',
      });
    }
    setSelectedTaskIds(taskIds);
    openBulkEditor();
  };

  const viewComponent =
    view === 'table' ? (
      <TasksTable
        visibleColumns={visibleColumns}
        tasks={tasks}
        tasksAreCompletedOrCancelled={status === 'completed' || status === 'cancelled'}
        tasksAreRecurring={status === 'recurring'}
        handleBulkEdit={showBulkEditDialog}
      />
    ) : (
      <TasksList tasks={tasks} />
    );

  return (
    <>
      <Group justify="space-between">
        <Group>
          <StatusSelector setStatus={setStatus} status={status} />
          <ViewTypeSelector view={view} setView={updateView} />
        </Group>

        <Group>
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
              ]}
              selected={visibleColumns}
              onChange={updateColumnVisibility}
            />
          )}
        </Group>
      </Group>
      {viewComponent}
      <Modal opened={bulkEditorOpened} onClose={closeBulkEditor} title="Bulk Edit Tasks">
        <BulkEditor taskIds={selectedTaskIds} />
      </Modal>
    </>
  );
}
