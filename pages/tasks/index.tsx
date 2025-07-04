import React, { useEffect, useState } from 'react';
import { Badge, Group, Modal, SegmentedControl, Table } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ColumnSelector from '@/components/Tasks/ColumnSelector';
import FilterSelector, { TaskFilter } from '@/components/Tasks/FilterSelector';
import TaskEditor from '@/components/Tasks/TaskEditor';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import { Task, TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
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
  const taskRepository = useTaskRepository();
  const [editorOpened, { open, close }] = useDisclosure(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'Active',
    'Description',
    'Tags',
    'Project',
    'Priority',
    'Due Date',
  ]);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>({
    requireTags: [],
    excludeTags: [],
    requireProjects: [],
    excludeProjects: [],
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState('pending');

  const filterTasks = (tasks: Task[]): Task[] => {
    return tasks.filter((task) => {
      // filter by tags
      const includesTags = taskFilter.requireTags.length
        ? taskFilter.requireTags.some((tag) => task.tags?.includes(tag))
        : true;
      const excludesTags = taskFilter.excludeTags.length
        ? !taskFilter.excludeTags.some((tag) => task.tags?.includes(tag))
        : true;

      // filter by projects. Projects are hierarchical, separated by dots,
      // so we will look for projects that start with what is provided
      // in the filter. This allows for filtering by parent projects as well.
      let includesProjects = !taskFilter.requireProjects.length;
      if (taskFilter.requireProjects.length && task.project) {
        for (const project of taskFilter.requireProjects) {
          if (task.project.startsWith(project)) {
            includesProjects = true;
            break;
          }
        }
      }
      let excludesProjects = !taskFilter.excludeProjects.length;
      if (taskFilter.excludeProjects.length && task.project) {
        for (const project of taskFilter.excludeProjects) {
          if (task.project.startsWith(project)) {
            excludesProjects = false;
            break;
          }
        }
      }

      return includesTags && excludesTags && includesProjects && excludesProjects;
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
            onChange={setVisibleColumns}
          />
          <FilterSelector {...taskFilter} setTaskFilter={setTaskFilter} />
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
            <Table.Tr key={task._id} onClick={() => showEditDialog(task)}>
              {visibleColumns.includes('Active') ? (
                <Table.Td>{task.status === TaskStatus.Started ? '⏳' : ''}</Table.Td>
              ) : null}
              <Table.Td>{task.title}</Table.Td>
              {visibleColumns.includes('Description') ? (
                <Table.Td>{task.description}</Table.Td>
              ) : null}
              {visibleColumns.includes('Tags') ? (
                <Table.Td>
                  {task.tags?.map((tag, index) => (
                    <Badge key={index} size="xs" mr={3} variant="light">{`#${tag}`}</Badge>
                  ))}
                </Table.Td>
              ) : null}
              {visibleColumns.includes('Project') ? <Table.Td>{task.project}</Table.Td> : null}
              {visibleColumns.includes('Priority') ? (
                <Table.Td>{priorityBadge(task.priority)}</Table.Td>
              ) : null}
              {visibleColumns.includes('Due Date') ? (
                <Table.Td c="orange.5">{task.dueDate}</Table.Td>
              ) : null}
              {visibleColumns.includes('Age') ? (
                <Table.Td>{getAgeInDays(task.createdAt)}</Table.Td>
              ) : null}
              {visibleColumns.includes('Urgency') ? <Table.Td>{getUrgency(task)}</Table.Td> : null}
              {status === 'completed' || status === 'cancelled' ? (
                <Table.Td>{task.updatedAt.toLocaleDateString()}</Table.Td>
              ) : null}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={editorOpened} onClose={close} title="Edit Task" size="lg">
        {selectedTask && <TaskEditor task={selectedTask} handleClose={cancelEditing} />}
      </Modal>
    </>
  );
}
