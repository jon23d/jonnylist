import React from 'react';
import { vi } from 'vitest';
import DueThisWeekWidget from '@/components/Dashboard/DueThisWeekWidget';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { render, screen, userEvent } from '@/test-utils/index';

vi.mock('@/components/Dashboard/DashboardTaskListItem', () => {
  return {
    default: ({
      task,
      badge,
      handleTaskClick,
    }: {
      task: Task;
      badge: React.ReactNode;
      handleTaskClick: (task: Task) => void;
    }) => (
      <button onClick={() => handleTaskClick(task)} type="button">
        {task.title} {badge}
      </button>
    ),
  };
});

describe('DueThisWeekWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Shows a loading state when tasks are being fetched', () => {
    render(<DueThisWeekWidget tasks={null} handleTaskClick={vi.fn()} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('Shows a message when there are no tasks due this week', () => {
    render(<DueThisWeekWidget tasks={[]} handleTaskClick={vi.fn()} />);

    // Wait for loading to finish
    const noTasksMessage = screen.getByText('No tasks due within 7 days');
    expect(noTasksMessage).toBeInTheDocument();
  });

  it('Renders a list of tasks', () => {
    // Create some tasks due within 7 days
    const tasks = [
      taskFactory({
        title: 'Task 1',
        dueDate: '2024-03-02',
        status: TaskStatus.Ready,
        _id: 'task-1',
      }),
      taskFactory({
        title: 'Task 2',
        dueDate: '2024-03-06',
        status: TaskStatus.Ready,
        _id: 'task-2',
      }),
    ];

    render(<DueThisWeekWidget tasks={tasks} handleTaskClick={vi.fn()} />);

    // Wait for loading to finish and tasks to be displayed
    const task1 = screen.getByText('Task 1');
    const task2 = screen.getByText('Task 2');

    expect(task1).toBeInTheDocument();
    expect(task2).toBeInTheDocument();
  });

  it('Includes a badge when a task is due today', async () => {
    vi.setSystemTime(new Date('2024-03-01T12:00:00Z'));

    const tasks = [
      taskFactory({
        title: 'Task 1',
        dueDate: '2024-03-01',
        status: TaskStatus.Ready,
        _id: 'task-1',
      }),
    ];

    render(<DueThisWeekWidget tasks={tasks} handleTaskClick={vi.fn()} />);

    const task1 = screen.getByText('Task 1');
    const dueTodayBadge = screen.getByText('Due Today');
    expect(task1).toBeInTheDocument();
    expect(dueTodayBadge).toBeInTheDocument();
  });

  it('Does not include a badge when a task is not due today', async () => {
    vi.setSystemTime(new Date('2024-03-01T12:00:00Z'));

    const tasks = [
      taskFactory({
        title: 'Task 1',
        dueDate: '2024-03-02',
        status: TaskStatus.Ready,
        _id: 'task-1',
      }),
    ];

    render(<DueThisWeekWidget tasks={tasks} handleTaskClick={vi.fn()} />);

    const task1 = screen.getByText('Task 1');
    expect(task1).toBeInTheDocument();
    expect(screen.queryByText('Due Today')).not.toBeInTheDocument();
  });

  it('Calls handleTaskClick when a task is clicked', async () => {
    vi.useRealTimers(); // If we do not do this, then userEvent.click does not work as expected

    const handleTaskClick = vi.fn();

    const tasks = [
      taskFactory({
        title: 'Task 1',
        dueDate: '2024-03-02',
        status: TaskStatus.Ready,
        _id: 'task-1',
      }),
    ];

    render(<DueThisWeekWidget tasks={tasks} handleTaskClick={handleTaskClick} />);

    const task1 = screen.getByText('Task 1');
    expect(task1).toBeInTheDocument();

    await userEvent.click(task1);

    expect(handleTaskClick).toHaveBeenCalledWith(tasks[0]);
  });
});
