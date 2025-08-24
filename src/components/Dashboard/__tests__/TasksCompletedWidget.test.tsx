import TasksCompletedWidget from '@/components/Dashboard/TasksCompletedWidget';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { render, screen } from '@/test-utils/index';

describe('TasksCompletedWidget', () => {
  it('Renders loading when tasks are undefined', () => {
    render(<TasksCompletedWidget />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('Renders the number of completed tasks', () => {
    const completedTasks = new Array(5).fill({}).map(taskFactory);

    render(<TasksCompletedWidget completedTasks={completedTasks} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
