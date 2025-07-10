import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Badge, Group, Modal, SegmentedControl, Table } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ContextModifier from '@/components/Contexts/ContextModifier';
import ColumnSelector from '@/components/Tasks/ColumnSelector';
import EditTaskForm from '@/components/Tasks/EditTaskForm';
import FilterSelector from '@/components/Tasks/FilterSelector';
import StatusChanger from '@/components/Tasks/StatusChanger';
import classes from '@/components/Tasks/Tasks.module.css';
import {
  useContextRepository,
  useDataSource,
  useTaskRepository,
} from '@/contexts/DataSourceContext';
import { Context } from '@/data/documentTypes/Context';
import { Task, TaskFilter, TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { Notifications } from '@/helpers/Notifications';
import { getAgeInDays, getUrgency } from '@/helpers/Tasks';

const priorityBadge = (priority?: TaskPriority) => {
  switch (priority) {
    case TaskPriority.Low:
      return <Badge color="gray.4">L</Badge>;
    case TaskPriority.Medium:
      return <Badge color="lime.4">M</Badge>;
    case TaskPriority.High:
      return <Badge color="yellow.5">H</Badge>;
    default:
      return null;
  }
};

export default function Page() {
  const router = useRouter();
  const dataSource = useDataSource();
  const taskRepository = useTaskRepository();
  const contextRepository = useContextRepository();
  const [editorOpened, { open, close }] = useDisclosure(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
    taskRepository.subscribeToTasks(
      {
        statuses,
      },
      (tasks) => setTasks(filterTasks(sortTasks(tasks)))
    );
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

  const showEditDialog = (task: Task) => {
    setSelectedTask(task);
    open();
  };

  const cancelEditing = () => {
    setSelectedTask(null);
    close();
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
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {visibleColumns.includes('Active') ? <Table.Th /> : null}
            <Table.Th>Title</Table.Th>
            {visibleColumns.includes('Description') ? <Table.Th>Description</Table.Th> : null}
            {visibleColumns.includes('Tags') ? <Table.Th>Tags</Table.Th> : null}
            {visibleColumns.includes('Project') ? <Table.Th>Project</Table.Th> : null}
            {visibleColumns.includes('Priority') ? <Table.Th>Priority</Table.Th> : null}
            {visibleColumns.includes('Due Date') ? <Table.Th>Due</Table.Th> : null}
            {visibleColumns.includes('Age') ? <Table.Th>Age</Table.Th> : null}
            {visibleColumns.includes('Urgency') ? <Table.Th>Urgency</Table.Th> : null}
            {status === 'completed' || status === 'cancelled' ? (
              <Table.Th>Completed</Table.Th>
            ) : null}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tasks.map((task) => (
            <Table.Tr key={task._id} className={classes.hasHoverControls}>
              {visibleColumns.includes('Active') ? (
                <Table.Td>
                  <StatusChanger task={task} />
                </Table.Td>
              ) : null}
              <Table.Td onClick={() => showEditDialog(task)}>{task.title}</Table.Td>
              {visibleColumns.includes('Description') ? (
                <Table.Td onClick={() => showEditDialog(task)}>{task.description}</Table.Td>
              ) : null}
              {visibleColumns.includes('Tags') ? (
                <Table.Td onClick={() => showEditDialog(task)}>
                  {task.tags?.map((tag, index) => (
                    <Badge key={index} size="xs" mr={3} variant="light">{`#${tag}`}</Badge>
                  ))}
                </Table.Td>
              ) : null}
              {visibleColumns.includes('Project') ? <Table.Td>{task.project}</Table.Td> : null}
              {visibleColumns.includes('Priority') ? (
                <Table.Td onClick={() => showEditDialog(task)}>
                  {priorityBadge(task.priority)}
                </Table.Td>
              ) : null}
              {visibleColumns.includes('Due Date') ? (
                <Table.Td c="orange.5" onClick={() => showEditDialog(task)}>
                  {task.dueDate}
                </Table.Td>
              ) : null}
              {visibleColumns.includes('Age') ? (
                <Table.Td onClick={() => showEditDialog(task)}>
                  {getAgeInDays(task.createdAt)}
                </Table.Td>
              ) : null}
              {visibleColumns.includes('Urgency') ? <Table.Td>{getUrgency(task)}</Table.Td> : null}
              {status === 'completed' || status === 'cancelled' ? (
                <Table.Td onClick={() => showEditDialog(task)}>
                  {task.updatedAt.toLocaleDateString()}
                </Table.Td>
              ) : null}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={editorOpened} onClose={close} title="Edit Task" size="lg">
        {selectedTask && <EditTaskForm task={selectedTask} handleClose={cancelEditing} />}
      </Modal>
    </>
  );
}
