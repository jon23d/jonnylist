import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Badge, Button, Center, Checkbox, Modal, Table, Text } from '@mantine/core';
import { useDisclosure, useViewportSize } from '@mantine/hooks';
import BulkEditor from '@/components/Tasks/BulkEditor';
import EditTaskForm from '@/components/Tasks/EditTaskForm';
import StatusChanger from '@/components/Tasks/StatusChanger';
import classes from '@/components/Tasks/Tasks.module.css';
import { usePreferencesRepository } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editorOpened, { open, close }] = useDisclosure(false);
  const { height: viewportHeight, width: viewportWidth } = useViewportSize();
  const [bulkEditorOpened, { close: closeBulkEditor, open: openBulkEditor }] = useDisclosure();
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const preferencesRepository = usePreferencesRepository();
  const [urgencyCalculator, setUrgencyCalculator] = useState<UrgencyCalculator | null>(null);

  useEffect(() => {
    const initializeUrgencyCalculator = async () => {
      if (urgencyCalculator === null) {
        const prefs = await preferencesRepository.getPreferences();
        setUrgencyCalculator(new UrgencyCalculator(prefs));
      }
    };
    initializeUrgencyCalculator();
  }, []);

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

  const getUrgency = (task: Task): number | undefined => {
    if (urgencyCalculator) {
      return urgencyCalculator.getUrgency(task);
    }
  };

  const completedDateValue = (task: Task): string => {
    if (task.status === TaskStatus.Cancelled) {
      return task.updatedAt ? task.updatedAt.toLocaleDateString() : '';
    }

    if (task.status === TaskStatus.Done) {
      return task.completedAt ? task.completedAt.toLocaleDateString() : '';
    }

    return '';
  };

  return (
    <>
      <Checkbox.Group value={selectedTaskIds} onChange={handleBulkSelect}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="25px" />
              {tasksAreRecurring && <Table.Th>Recurrence</Table.Th>}
              <Table.Th>Title</Table.Th>
              {visibleColumns.includes('Description') && <Table.Th>Description</Table.Th>}
              {visibleColumns.includes('Tags') && <Table.Th>Tags</Table.Th>}
              {visibleColumns.includes('Project') && <Table.Th>Project</Table.Th>}
              {visibleColumns.includes('Priority') && <Table.Th>Priority</Table.Th>}
              {visibleColumns.includes('Due Date') && <Table.Th>Due</Table.Th>}
              {visibleColumns.includes('Age') && <Table.Th>Age</Table.Th>}
              {visibleColumns.includes('Urgency') && <Table.Th>Urgency</Table.Th>}
              {tasksAreCompletedOrCancelled && <Table.Th>Completed</Table.Th>}
              {visibleColumns.includes('Bulk Editor') && (
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
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tasks.map((task) => (
              <Table.Tr
                key={task._id}
                className={clsx(classes.hasHoverControls, classes.taskTableRow)}
              >
                <Table.Td>
                  <StatusChanger task={task} />
                </Table.Td>
                {tasksAreRecurring && (
                  <Table.Td onClick={() => showEditDialog(task)}>
                    {describeRecurrence(task)}
                  </Table.Td>
                )}
                <Table.Td onClick={() => showEditDialog(task)}>{task.title}</Table.Td>
                {visibleColumns.includes('Description') && (
                  <Table.Td onClick={() => showEditDialog(task)}>{task.description}</Table.Td>
                )}
                {visibleColumns.includes('Tags') && (
                  <Table.Td onClick={() => showEditDialog(task)}>
                    {task.tags?.map((tag, index) => (
                      <Badge key={index} size="xs" mr={3} variant="light">{`#${tag}`}</Badge>
                    ))}
                  </Table.Td>
                )}
                {visibleColumns.includes('Project') && (
                  <Table.Td onClick={() => showEditDialog(task)}>{task.project}</Table.Td>
                )}
                {visibleColumns.includes('Priority') && (
                  <Table.Td onClick={() => showEditDialog(task)}>
                    {priorityBadge(task.priority)}
                  </Table.Td>
                )}
                {visibleColumns.includes('Due Date') && (
                  <Table.Td c="orange.5" onClick={() => showEditDialog(task)}>
                    {task.dueDate}
                  </Table.Td>
                )}
                {visibleColumns.includes('Age') && (
                  <Table.Td onClick={() => showEditDialog(task)}>
                    {getAgeInDays(task.createdAt)} days
                  </Table.Td>
                )}
                {visibleColumns.includes('Urgency') && <Table.Td>{getUrgency(task)}</Table.Td>}
                {tasksAreCompletedOrCancelled && (
                  <Table.Td onClick={() => showEditDialog(task)}>
                    {completedDateValue(task)}
                  </Table.Td>
                )}
                {visibleColumns.includes('Bulk Editor') && (
                  <Table.Td>
                    <Center>
                      <Checkbox value={task._id} />
                    </Center>
                  </Table.Td>
                )}
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
