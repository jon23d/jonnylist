import React from 'react';
import TasksTable from '@/components/Tasks/TasksTable';
import { Task, TaskPriority } from '@/data/documentTypes/Task';
import { renderWithDataSource, screen, userEvent } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import { taskFactory } from '@/test-utils/factories/TaskFactory';

jest.mock('@/helpers/Tasks', () => {
  const actual = jest.requireActual('@/helpers/Tasks');

  return {
    __esModule: true,
    ...actual,
    getUrgency: (_task: Task) => 123.45,
    priorityBadge: (priority: TaskPriority) => {
      switch (priority) {
        case TaskPriority.High:
          return 'High Priority';
        case TaskPriority.Medium:
          return 'Medium Priority';
        case TaskPriority.Low:
          return TaskPriority.Low;
      }
    },
  };
});

jest.mock('@/components/Tasks/StatusChanger', () => {
  return function StatusChanger({ task }: { task: Task }) {
    return <div data-testid={task._id}>status changer</div>;
  };
});

jest.mock('@/components/Tasks/EditTaskForm', () => {
  return function EditTaskForm({ task, handleClose }: { task: Task; handleClose: () => void }) {
    return (
      <div>
        <div>editing task {task._id}</div>
        <div>
          <button type="button" onClick={handleClose}>
            stop editing
          </button>
        </div>
      </div>
    );
  };
});

jest.mock('@/components/Tasks/BulkEditor', () => {
  return function BulkEditor({
    tasks,
    onCancel,
    onSave,
  }: {
    tasks: Task[];
    onCancel: () => void;
    onSave: () => void;
  }) {
    return (
      <div>
        {tasks.map((task) => `bulk-${task._id}`).join(',')}
        <button type="button" onClick={onSave}>
          Save bulk
        </button>
        <button type="button" onClick={onCancel}>
          Cancel bulk
        </button>
      </div>
    );
  };
});

describe('TasksTable', () => {
  const { getDataSource } = setupTestDatabase();

  const tasks = [
    taskFactory({
      _id: 'task-1',
      title: 'taskTitle',
      description: 'aDescription',
      tags: ['aTag'],
      project: 'aProject',
      priority: TaskPriority.High,
      dueDate: '2024-01-01',
      createdAt: new Date(),
    }),
  ];

  it.each([
    ['Description', 'Description', 'aDescription'],
    ['Tags', 'Tags', '#aTag'],
    ['Project', 'Project', 'aProject'],
    ['Priority', 'Priority', 'High Priority'],
    ['Due Date', 'Due', '2024-01-01'],
    ['Age', 'Age', '0 days'],
    ['Urgency', 'Urgency', '123.45'],
  ])(
    'Correctly shows column %s when included in visibleColumns prop',
    (columnKey: string, columnHeader: string, valueInTable: string) => {
      // With the column
      renderWithDataSource(
        <TasksTable visibleColumns={[columnKey]} tasks={tasks} />,
        getDataSource()
      );

      expect(screen.getByText(columnHeader)).toBeInTheDocument();
      expect(screen.getByText(valueInTable)).toBeInTheDocument();
    }
  );

  it.each([
    ['Description', 'Description', 'aDescription'],
    ['Tags', 'Tags', '#aTag'],
    ['Project', 'Project', 'aProject'],
    ['Priority', 'Priority', 'High Priority'],
    ['Due Date', 'Due', '2024-01-01'],
    ['Age', 'Age', '0 days'],
    ['Urgency', 'Urgency', '123.45'],
  ])(
    'Correctly hides column %s when not included in visibleColumns prop',
    (_columnKey: string, columnHeader: string, valueInTable: string) => {
      renderWithDataSource(<TasksTable visibleColumns={[]} tasks={tasks} />, getDataSource());

      expect(screen.queryByText(columnHeader)).not.toBeInTheDocument();
      expect(screen.queryByText(valueInTable)).not.toBeInTheDocument();
    }
  );

  it('Shows active column with StatusChanger component', () => {
    renderWithDataSource(<TasksTable visibleColumns={['Active']} tasks={tasks} />, getDataSource());

    expect(screen.getByTestId('task-1')).toBeInTheDocument();
    expect(screen.queryByText('status changer')).toBeInTheDocument();
  });

  it('Hides active column', () => {
    renderWithDataSource(<TasksTable visibleColumns={[]} tasks={tasks} />, getDataSource());

    expect(screen.queryByText('status changer')).not.toBeInTheDocument();
  });

  it('Shows the task editor with the selected task when a task is clicked', async () => {
    renderWithDataSource(<TasksTable visibleColumns={[]} tasks={tasks} />, getDataSource());

    // we shouldn't see the edit dialog yet
    expect(screen.queryByText('Edit Task')).not.toBeInTheDocument();

    // click a row
    await userEvent.click(screen.getByText('taskTitle'));

    // the edit dialog should show, and it should receive a task
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByText('editing task task-1')).toBeInTheDocument();

    // clicking the close button should close the dialog
    await userEvent.click(screen.getByRole('button', { name: 'stop editing' }));
    expect(screen.queryByText('Edit Task')).not.toBeInTheDocument();
  });

  it('Disables the bulk edit button when no tasks are selected', () => {
    renderWithDataSource(<TasksTable visibleColumns={[]} tasks={tasks} />, getDataSource());

    expect(screen.getByRole('button', { name: 'Edit Selected' })).toBeDisabled();
  });

  it('Allows bulk editing when tasks are selected', async () => {
    renderWithDataSource(
      <TasksTable
        visibleColumns={[]}
        tasks={[
          ...tasks,
          taskFactory({
            _id: 'task-2',
          }),
          taskFactory({
            _id: 'task-3',
          }),
        ]}
      />,
      getDataSource()
    );

    await userEvent.click(screen.queryAllByRole('checkbox')[0]);
    await userEvent.click(screen.queryAllByRole('checkbox')[1]);
    await userEvent.click(screen.getByText('Edit Selected'));

    expect(screen.getByText('Bulk Edit Tasks')).toBeInTheDocument();
    expect(screen.getByText('bulk-task-1,bulk-task-2')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Save bulk' }));
    expect(screen.queryByText('Bulk Edit Tasks')).not.toBeInTheDocument();
  });
});
