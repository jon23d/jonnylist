import React, { useEffect, useState } from 'react';
import { Badge, Button, Center, Checkbox, Modal, Table, Text } from '@mantine/core';
import { useDisclosure, useViewportSize } from '@mantine/hooks';
import BulkEditor from '@/components/Tasks/BulkEditor';
import EditTaskForm from '@/components/Tasks/EditTaskForm';
import StatusChanger from '@/components/Tasks/StatusChanger';
import classes from '@/components/Tasks/Tasks.module.css';
import { usePreferencesRepository } from '@/contexts/DataSourceContext';
import { Task } from '@/data/documentTypes/Task';
import { Notifications } from '@/helpers/Notifications';
import { describeRecurrence, getAgeInDays, priorityBadge } from '@/helpers/Tasks';
import { UrgencyCalculator } from '@/helpers/UrgencyCalculator';

export default function TasksTable({
  visibleColumns,
  tasks,
  tasksAreCompletedOrCancelled,
  tasksAreRecurring,
}: {
  visibleColumns: string[];
  tasks: Task[];
  tasksAreCompletedOrCancelled?: boolean;
  tasksAreRecurring?: boolean;
}) {
  const preferencesRepository = usePreferencesRepository();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editorOpened, { open, close }] = useDisclosure(false);
  const { height: viewportHeight, width: viewportWidth } = useViewportSize();
  const [bulkEditorOpened, { close: closeBulkEditor, open: openBulkEditor }] = useDisclosure();
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [urgencies, setUrgencies] = useState<Record<string, number>>({});

  useEffect(() => {
    const getUrgencies = async () => {
      const preferences = await preferencesRepository.getPreferences();
      const calculator = new UrgencyCalculator(preferences);
      const urgencies: Record<string, number> = tasks.reduce(
        (acc, task) => {
          acc[task._id] = calculator.getUrgency(task);
          return acc;
        },
        {} as Record<string, number>
      );
      setUrgencies(urgencies);
    };
    getUrgencies();
  });

  const showEditDialog = (task: Task) => {
    setSelectedTask(task);
    open();
  };

  const cancelEditing = () => {
    setSelectedTask(null);
    close();
  };

  const showBulkEditDialog = (selectedTasks: Task[]) => {
    if (selectedTasks.length === 0) {
      Notifications.showError({
        title: 'Error',
        message: 'No tasks selected for bulk edit',
      });
    }
    setSelectedTasks(selectedTasks);
    openBulkEditor();
  };

  if (!tasks.length) {
    return <Text mt={20}>No tasks match current filters</Text>;
  }

  const selectedTaskIds = selectedTasks.map((task) => task._id);
  const handleBulkSelect = (values: string[]) => {
    // extract the tasks with an _id found in values and assign to selectedTasks
    const selectedTasks = tasks.filter((task) => values.includes(task._id));
    setSelectedTasks(selectedTasks);
  };
  const onSave = () => {
    setSelectedTasks([]);
    closeBulkEditor();
  };

  return (
    <>
      <Checkbox.Group value={selectedTaskIds} onChange={handleBulkSelect}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {visibleColumns.includes('Active') ? <Table.Th w="25px" /> : null}
              {tasksAreRecurring ? <Table.Th>Recurrence</Table.Th> : null}
              <Table.Th>Title</Table.Th>
              {visibleColumns.includes('Description') ? <Table.Th>Description</Table.Th> : null}
              {visibleColumns.includes('Tags') ? <Table.Th>Tags</Table.Th> : null}
              {visibleColumns.includes('Project') ? <Table.Th>Project</Table.Th> : null}
              {visibleColumns.includes('Priority') ? <Table.Th>Priority</Table.Th> : null}
              {visibleColumns.includes('Due Date') ? <Table.Th>Due</Table.Th> : null}
              {visibleColumns.includes('Age') ? <Table.Th>Age</Table.Th> : null}
              {visibleColumns.includes('Urgency') ? <Table.Th>Urgency</Table.Th> : null}
              {tasksAreCompletedOrCancelled ? <Table.Th>Completed</Table.Th> : null}
              <Table.Th ta="center">
                <Button
                  className={classes.bulkEditButton}
                  variant="transparent"
                  disabled={!selectedTasks.length}
                  size="xs"
                  onClick={() => showBulkEditDialog(selectedTasks)}
                >
                  Edit Selected
                </Button>
              </Table.Th>
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
                {tasksAreRecurring ? (
                  <Table.Td onClick={() => showEditDialog(task)}>
                    {describeRecurrence(task)}
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
                {visibleColumns.includes('Project') ? (
                  <Table.Td onClick={() => showEditDialog(task)}>{task.project}</Table.Td>
                ) : null}
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
                    {getAgeInDays(task.createdAt)} days
                  </Table.Td>
                ) : null}
                {visibleColumns.includes('Urgency') ? (
                  <Table.Td>{urgencies[task._id]}</Table.Td>
                ) : null}
                {tasksAreCompletedOrCancelled ? (
                  <Table.Td onClick={() => showEditDialog(task)}>
                    {task.updatedAt.toLocaleDateString()}
                  </Table.Td>
                ) : null}
                <Table.Td>
                  <Center>
                    <Checkbox value={task._id} />
                  </Center>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Checkbox.Group>

      <Modal
        opened={editorOpened}
        onClose={close}
        title="Edit Task"
        size="lg"
        fullScreen={viewportWidth < 768 || viewportHeight < 500}
      >
        {selectedTask && <EditTaskForm task={selectedTask} handleClose={cancelEditing} />}
      </Modal>

      <Modal opened={bulkEditorOpened} onClose={closeBulkEditor} title="Bulk Edit Tasks">
        <BulkEditor tasks={selectedTasks} onCancel={closeBulkEditor} onSave={onSave} />
      </Modal>
    </>
  );
}
