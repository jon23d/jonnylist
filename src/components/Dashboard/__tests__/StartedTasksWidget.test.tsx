import { vi } from 'vitest';
import StartedTasksWidget from '@/components/Dashboard/StartedTasksWidget';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { render, screen, userEvent } from '@/test-utils/index';

vi.mock('@/components/Dashboard/TaskListItem', () => {
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

describe('StartedTasksWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Shows a loading state when tasks are being fetched', () => {
    render(<StartedTasksWidget tasks={null} handleTaskClick={vi.fn()} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('Shows a message when there are no started tasks', () => {
    render(<StartedTasksWidget tasks={[]} handleTaskClick={vi.fn()} />);

    // Wait for loading to finish
    const noTasksMessage = screen.getByText('No in-progress tasks');
    expect(noTasksMessage).toBeInTheDocument();
  });

  it('Renders a list of tasks', () => {
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

    render(<StartedTasksWidget tasks={tasks} handleTaskClick={vi.fn()} />);

    // Wait for loading to finish and tasks to be displayed
    const task1 = screen.getByText('Task 1');
    const task2 = screen.getByText('Task 2');

    expect(task1).toBeInTheDocument();
    expect(task2).toBeInTheDocument();
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

    render(<StartedTasksWidget tasks={tasks} handleTaskClick={handleTaskClick} />);

    const task1 = screen.getByText('Task 1');
    expect(task1).toBeInTheDocument();

    await userEvent.click(task1);

    expect(handleTaskClick).toHaveBeenCalledWith(tasks[0]);
  });
});
