import React, { useEffect, useState } from 'react';
import { IconCalendarFilled, IconLayoutKanbanFilled, IconList } from '@tabler/icons-react';
import { Badge, Center, Modal, SegmentedControl, Table } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ViewType } from '@/components/Contexts/Views/ViewSelector';
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

  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState('pending');

  const sortTasks = (tasks: Task[]): Task[] => {
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
      (tasks) => setTasks(sortTasks(tasks))
    );
  }, [status]);

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
      <SegmentedControl
        data={['pending', 'completed', 'cancelled', 'recurring', 'waiting']}
        value={status}
        onChange={setStatus}
      />
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>Title</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Tags</Table.Th>
            <Table.Th>Project</Table.Th>
            <Table.Th>Priority</Table.Th>
            <Table.Th>Due</Table.Th>
            <Table.Th>Age</Table.Th>
            <Table.Th>Urgency</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {tasks.map((task) => (
            <Table.Tr key={task._id} onClick={() => showEditDialog(task)}>
              <Table.Td>{task.status === TaskStatus.Started ? '⏳' : ''}</Table.Td>
              <Table.Td>{task.title}</Table.Td>
              <Table.Td>{task.description}</Table.Td>
              <Table.Td>
                {task.tags?.map((tag, index) => (
                  <Badge key={index} size="xs" mr={3} variant="light">{`#${tag}`}</Badge>
                ))}
              </Table.Td>
              <Table.Td>{task.project}</Table.Td>
              <Table.Td>{priorityBadge(task.priority)}</Table.Td>
              <Table.Td c="orange.5">{task.dueDate}</Table.Td>
              <Table.Td>{getAgeInDays(task.createdAt)}</Table.Td>
              <Table.Td>{getUrgency(task)}</Table.Td>
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
