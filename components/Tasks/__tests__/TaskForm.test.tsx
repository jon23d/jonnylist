import { useForm, UseFormInput } from '@mantine/form';
import { useOs } from '@mantine/hooks';
import TaskForm, { TaskFormType } from '@/components/Tasks/TaskForm';
import { TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { render, screen, userEvent, within } from '@/test-utils';

jest.mock('@mantine/hooks', () => {
  const actualModule = jest.requireActual('@mantine/hooks');
  return {
    __esModule: true,
    ...actualModule,
    useOs: jest.fn().mockReturnValue('macos'), // Default to desktop OS
  };
});

describe('TaskForm', () => {
  const TestComponent = ({
    formInput,
    handleSubmit,
  }: {
    formInput: UseFormInput<TaskFormType>;
    handleSubmit: () => void;
  }) => {
    const form = useForm<TaskFormType>(formInput);

    return <TaskForm form={form} handleSubmit={handleSubmit} />;
  };

  it('Renders basic form fields', async () => {
    const formInput = {
      initialValues: {
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
      },
    };

    render(<TestComponent formInput={formInput} handleSubmit={jest.fn()} />);

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

  it('Shows an global error message if form.errors is populated', async () => {
    const formInput = {
      initialValues: {
        title: '',
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
      },
      validate: {
        title: (value: string) => (value ? null : 'Title is required'),
      },
    };

    render(<TestComponent formInput={formInput} handleSubmit={jest.fn()} />);

    const submitButton = screen.getByRole('button', { name: 'Save Task' });
    await userEvent.click(submitButton);

    expect(screen.getByText('Fix errors to continue')).toBeInTheDocument();
  });

  it('Focuses on the first input of each tab when opened on desktop', async () => {
    const formInput = {
      initialValues: {
        title: 'test',
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
      },
      validate: {
        title: (value: string) => (value ? null : 'Title is required'),
      },
    };

    render(<TestComponent formInput={formInput} handleSubmit={jest.fn()} />);

    // The default tab is "Basics"
    expect(screen.getByLabelText('Title *')).toHaveFocus();

    // Advanced
    await userEvent.click(screen.getByText('Advanced'));
    expect(screen.getByLabelText('Description')).toHaveFocus();

    // Notes
    await userEvent.click(screen.getByText('Notes'));
    expect(screen.getByLabelText('New Note')).toHaveFocus();

    // And back to Basics
    await userEvent.click(screen.getByText('Basics'));
    expect(screen.getByLabelText('Title *')).toHaveFocus();
  });

  it.each(['ios', 'android'])(
    'Does not focus on inputs when opened on mobile',
    async (os: string) => {
      (useOs as jest.Mock).mockReturnValue(os); // Simulate mobile OS
      const formInput = {
        initialValues: {
          title: 'test',
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
        },
        validate: {
          title: (value: string) => (value ? null : 'Title is required'),
        },
      };

      render(<TestComponent formInput={formInput} handleSubmit={jest.fn()} />);

      // The default tab is "Basics"
      expect(screen.getByLabelText('Title *')).not.toHaveFocus();

      // Advanced
      await userEvent.click(screen.getByText('Advanced'));
      expect(screen.getByLabelText('Description')).not.toHaveFocus();

      // Notes
      await userEvent.click(screen.getByText('Notes'));
      expect(screen.getByLabelText('New Note')).not.toHaveFocus();

      // And back to Basics
      await userEvent.click(screen.getByText('Basics'));
      expect(screen.getByLabelText('Title *')).not.toHaveFocus();
    }
  );

  it('Highlights the advanced and notes tabs if they have data', async () => {
    const formInput = {
      initialValues: {
        title: 'Task title',
        description: undefined,
        tags: ['tag1', 'tag2'],
        project: 'Project A',
        priority: TaskPriority.Low,
        dueDate: '2024-12-31',
        status: TaskStatus.Cancelled,
        waitUntil: undefined,
        notes: [],
        isRecurring: false,
      },
    };

    render(<TestComponent formInput={formInput} handleSubmit={jest.fn()} />);

    // The labels are within the actual tab elements
    const advancedTab = within(screen.getByRole('tab', { name: 'Advanced' })).getByText('Advanced');
    const notesTab = within(screen.getByRole('tab', { name: 'Notes' })).getByText('Notes');

    // They don't have data and should not be italic
    expect(advancedTab).not.toHaveClass('hasData');
    expect(notesTab).not.toHaveClass('hasData');

    // Let's add a description
    await userEvent.click(advancedTab);
    await userEvent.type(screen.getByLabelText('Description'), 'This is a description');

    expect(advancedTab).toHaveClass('hasData');

    // And a note
    await userEvent.click(notesTab);
    await userEvent.type(screen.getByLabelText('New Note'), 'This is a note');
    await userEvent.click(screen.getByRole('button', { name: 'Add Note' }));
    expect(notesTab).toHaveClass('hasData');
  });

  it('Highlights tabs with form errors', async () => {
    const formInput = {
      initialValues: {
        title: '',
        description: undefined,
        tags: ['tag1', 'tag2'],
        project: 'Project A',
        priority: TaskPriority.Low,
        dueDate: '2024-12-31',
        status: TaskStatus.Cancelled,
        waitUntil: undefined,
        notes: [],
        isRecurring: false,
      },
      validate: {
        title: (value: string) => (value ? null : 'Title is required'),
        description: (value?: string) => (value && value.includes('fail') ? 'failed' : null),
      },
    };

    render(<TestComponent formInput={formInput} handleSubmit={jest.fn()} />);

    const basicsTab = within(screen.getByRole('tab', { name: 'Basics' })).getByText('Basics');
    const advancedTab = within(screen.getByRole('tab', { name: 'Advanced' })).getByText('Advanced');

    // There are no errors yet, so tabs should not be highlighted
    expect(basicsTab).not.toHaveClass('hasErrors');
    expect(advancedTab).not.toHaveClass('hasErrors');

    // If we click save now, the Basics tab should be highlighted, since title is empty
    const submitButton = screen.getByRole('button', { name: 'Save Task' });
    await userEvent.click(submitButton);
    expect(basicsTab).toHaveClass('hasErrors');

    // Let's put a known failure value in the description
    await userEvent.click(advancedTab);
    await userEvent.type(screen.getByLabelText('Description'), 'fail');
    await userEvent.click(submitButton);
    expect(advancedTab).toHaveClass('hasErrors');
  });

  it('Adds a note when the user clicks the "Add Note" button', async () => {
    const formInput = {
      initialValues: {
        title: 'Task title',
        description: 'Task description',
        tags: ['tag1', 'tag2'],
        project: 'Project A',
        priority: TaskPriority.Low,
        dueDate: '2024-12-31',
        status: TaskStatus.Cancelled,
        waitUntil: '2024-10-01',
        notes: [],
        isRecurring: false,
      },
    };

    render(<TestComponent formInput={formInput} handleSubmit={jest.fn()} />);

    // Go to Notes tab
    await userEvent.click(screen.getByText('Notes'));

    // There should be no notes initially
    expect(screen.queryByTestId('note-0')).not.toBeInTheDocument();

    // Add a note
    const newNoteInput = screen.getByLabelText('New Note');
    await userEvent.type(newNoteInput, 'This is a new note');
    const addNoteButton = screen.getByRole('button', { name: 'Add Note' });
    await userEvent.click(addNoteButton);

    // Check if the note was added
    expect(
      within(screen.getByTestId('note-0')).getByText('This is a new note')
    ).toBeInTheDocument();
  });

  it('Should call handleSubmit when the form is submitted', async () => {
    const handleSubmit = jest.fn();
    const formInput = {
      initialValues: {
        title: 'Task title',
        description: 'Task description',
        tags: ['tag1', 'tag2'],
        project: 'Project A',
        priority: TaskPriority.Low,
        dueDate: '2024-12-31',
        status: TaskStatus.Cancelled,
        waitUntil: '2024-10-01',
        notes: [],
        isRecurring: false,
      },
    };

    render(<TestComponent formInput={formInput} handleSubmit={handleSubmit} />);

    const submitButton = screen.getByRole('button', { name: 'Save Task' });
    await userEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalled();
  });
});
