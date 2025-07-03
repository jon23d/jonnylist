import List from '@/components/Contexts/Views/List/List';
import { TaskStatus } from '@/data/documentTypes/Task';
import { renderWithDataSource, screen } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import { taskFactory } from '@/test-utils/factories/TaskFactory';

const mockTaskRepository = {
  updateTask: jest.fn(),
};
jest.mock('@/contexts/DataSourceContext', () => ({
  ...jest.requireActual('@/contexts/DataSourceContext'),
  useTaskRepository: () => mockTaskRepository,
}));

describe('Task list view component', () => {
  const { getDataSource } = setupTestDatabase();

  it('Only renders tasks with visible statuses', async () => {
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    const tasks = [
      taskFactory({ _id: '1', status: TaskStatus.Ready, title: 'Task 1' }),
      taskFactory({ _id: '2', status: TaskStatus.Started, title: 'Task 2' }),
      taskFactory({ _id: '3', status: TaskStatus.Done, title: 'Task 3' }),
    ];
    await Promise.all(tasks.map((task) => taskRepository.addTask(task)));

    renderWithDataSource(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Started]} />,
      dataSource
    );

    expect(screen.queryByText('ready (1)')).toBeInTheDocument();
    expect(screen.queryByText('started (1)')).toBeInTheDocument();
    expect(screen.queryByText('done (1)')).not.toBeInTheDocument();
  });
});
