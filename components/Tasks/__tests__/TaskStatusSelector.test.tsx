import TaskStatusSelector from '@/components/Tasks/TaskStatusSelector';
import { TaskStatus } from '@/data/documentTypes/Task';
import { render, screen, userEvent } from '@/test-utils';

jest.mock('@/data/documentTypes/Task', () => ({
  TaskStatus: {
    Ready: 'ready',
    Done: 'done',
  },
  taskStatusSelectOptions: [
    { value: 'ready', label: 'Ready' },
    { value: 'done', label: 'Done' },
  ],
}));

describe('TaskStatusSelector', () => {
  it('Renders all the task status options', () => {
    render(<TaskStatusSelector value={[TaskStatus.Ready]} onChange={jest.fn()} />);

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('Calls onChange when updates are made', async () => {
    const onChange = jest.fn();
    render(<TaskStatusSelector value={[TaskStatus.Ready]} onChange={onChange} />);

    const done = screen.getByText('Done');
    await userEvent.click(done);

    expect(onChange).toHaveBeenCalledWith([TaskStatus.Ready, TaskStatus.Done]);
  });
});
