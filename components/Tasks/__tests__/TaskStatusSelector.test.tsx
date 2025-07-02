import TaskStatusSelector from '@/components/Tasks/TaskStatusSelector';
import { TaskStatus } from '@/data/documentTypes/Task';
import { render, screen, userEvent } from '@/test-utils';

describe('TaskStatusSelector', () => {
  it('Renders all the task status options', () => {
    render(<TaskStatusSelector value={[TaskStatus.Ready]} onChange={jest.fn()} />);

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByText('Started')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('Calls onChange when updates are made', async () => {
    const onChange = jest.fn();
    render(<TaskStatusSelector value={[TaskStatus.Ready]} onChange={onChange} />);

    const done = screen.getByText('Done');
    await userEvent.click(done);

    expect(onChange).toHaveBeenCalledWith([TaskStatus.Ready, TaskStatus.Done]);
  });

  it('Always returns the statuses sorted in a specific order', async () => {
    const onChange = jest.fn();
    render(
      <TaskStatusSelector
        value={[TaskStatus.Cancelled, TaskStatus.Done, TaskStatus.Ready, TaskStatus.Waiting]}
        onChange={onChange}
      />
    );

    await userEvent.click(screen.getByText('Started'));
    expect(onChange).toHaveBeenCalledWith([
      TaskStatus.Started,
      TaskStatus.Waiting,
      TaskStatus.Ready,
      TaskStatus.Done,
      TaskStatus.Cancelled,
    ]);
  });
});
