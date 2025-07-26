import { useForm } from '@mantine/form';
import TaskForm, { TaskFormType } from '@/components/Tasks/TaskForm';
import { TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { render, screen, userEvent, within } from '@/test-utils';

describe('TaskForm', () => {
  const TestComponent = ({
    initialValues,
    handleSubmit,
  }: {
    initialValues: TaskFormType;
    handleSubmit: () => void;
  }) => {
    const form = useForm<TaskFormType>({
      initialValues,
    });

    return <TaskForm form={form} handleSubmit={handleSubmit} />;
  };

  it('Renders basic form fields', async () => {
    const initialValues = {
      title: 'Task title',
      description: 'Task description',
      tags: ['tag1', 'tag2'],
      project: 'Project A',
      priority: TaskPriority.Low,
      dueDate: '2024-12-31',
      status: TaskStatus.Cancelled,
      waitUntil: '2024-10-01',
      notes: [
        {
          noteText: 'This is a note',
          createdAt: '2024-01-01 12:30',
        },
      ],
      isRecurring: false,
    };

    render(<TestComponent initialValues={initialValues} handleSubmit={jest.fn()} />);

    // Basics tab
    expect(screen.getByLabelText('Title *')).toHaveValue('Task title');

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();

    expect(screen.getByLabelText('Project')).toHaveValue('Project A');

    const prioritySelect = screen.getByRole('textbox', { name: 'Priority' });
    expect(prioritySelect).toHaveValue('Low');

    const dueDateInput = screen.getByLabelText('Due Date');
    expect(within(dueDateInput).getByText('December 31, 2024')).toBeInTheDocument();

    const statusInput = screen.getByRole('textbox', { name: 'Status' });
    expect(statusInput).toHaveValue('Cancelled');

    // Advanced tab
    await userEvent.click(screen.getByText('Advanced'));

    expect(screen.getByLabelText('Description')).toHaveValue('Task description');
    const waitUntil = screen.getByLabelText('Wait Until');
    expect(within(waitUntil).getByText('October 1, 2024')).toBeInTheDocument();

    expect(screen.getByLabelText('Repeating')).not.toBeChecked();

    // Notes tab
    await userEvent.click(screen.getByLabelText('Notes'));

    expect(screen.getByText('This is a note')).toBeInTheDocument();
    expect(screen.getByText('1/1/2024, 12:30:00 PM')).toBeInTheDocument();

    screen.debug(undefined, Infinity);
  });
});
