import { waitFor } from '@testing-library/react';
import { DateInput } from '@mantine/dates';
import { TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { renderWithDataSource, screen, userEvent } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import NewTaskForm from '../NewTaskForm';

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    query: {},
  }),
}));

// The DatePickerInput is not very testable, so we are going to use the DatePicker input in test instead
jest.mock('@mantine/dates', () => ({
  ...jest.requireActual('@mantine/dates'),
  DatePickerInput: jest.fn(({ ...props }) => <DateInput {...props} />),
}));

describe('NewTaskForm', () => {
  const { getDataSource } = setupTestDatabase();

  it('Saves a new task when the form is submitted', async () => {
    const handleClose = jest.fn();
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    await userEvent.type(titleInput, 'Test Task');

    const tagsInput = screen.getByRole('textbox', { name: 'Tags' });
    await userEvent.type(tagsInput, 'test-tag{enter}');
    await userEvent.type(tagsInput, 'another-tag{enter}');

    await userEvent.click(screen.getByRole('textbox', { name: 'Priority' }));
    await userEvent.click(screen.getByRole('option', { name: 'Low' }));

    const dueDateInput = screen.getByRole('textbox', { name: 'Due Date' });
    await userEvent.type(dueDateInput, '01/15/2026');

    const projectInput = screen.getByRole('textbox', { name: 'Project' });
    await userEvent.type(projectInput, 'Test Project');

    // Go to the advanced tab as well
    const advancedTab = screen.getByRole('tab', { name: 'Advanced' });
    await userEvent.click(advancedTab);

    const descriptionInput = screen.getByRole('textbox', { name: 'Description' });
    await userEvent.type(descriptionInput, 'This is a test task description.');

    const submitButton = screen.getByRole('button', { name: 'Create Task' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });

    const tasks = await taskRepository.getTasks({});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test Task');
    expect(tasks[0].description).toBe('This is a test task description.');
    expect(tasks[0].tags).toStrictEqual(['test-tag', 'another-tag']);
    expect(tasks[0].priority).toBe(TaskPriority.Low);
    expect(tasks[0].dueDate).toBe('2026-01-15');
    expect(tasks[0].status).toBe(TaskStatus.Ready);
    expect(tasks[0].project).toBe('Test Project');
  });

  it('Sets the status to waiting when the waitUntil date is present', async () => {
    const handleClose = jest.fn();
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    await userEvent.type(titleInput, 'Test Task');

    const advancedTab = screen.getByRole('tab', { name: 'Advanced' });
    await userEvent.click(advancedTab);

    const dueDateInput = screen.getByRole('textbox', { name: 'Wait Until' });
    await userEvent.type(dueDateInput, '03/15/2026');

    const submitButton = screen.getByRole('button', { name: 'Create Task' });
    await userEvent.click(submitButton);

    await waitFor(
      () => {
        expect(handleClose).toHaveBeenCalled();
      },
      {
        timeout: 5000,
        interval: 100,
      }
    );

    const tasks = await taskRepository.getTasks({});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test Task');
    expect(tasks[0].status).toBe(TaskStatus.Waiting);
    expect(tasks[0].waitUntil).toBe('2026-03-15');
  });

  it('Blurs the active element when the form is submitted', async () => {
    const handleClose = jest.fn();
    const dataSource = getDataSource();

    renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    await userEvent.type(titleInput, 'Test Task');

    // Keep focus on the title input (simulating Enter key submission)
    titleInput.focus();
    expect(document.activeElement).toBe(titleInput);

    // Spy on the blur method of the currently active element
    const blurSpy = jest.spyOn(titleInput, 'blur');

    // Submit via Enter key instead of clicking the button
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });

    // Verify that blur was called on the active element (title input)
    expect(blurSpy).toHaveBeenCalled();

    blurSpy.mockRestore();
  });

  it('Converts recurrence day of week to number', async () => {
    const handleClose = jest.fn();
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    await userEvent.type(titleInput, 'Recurring Task');

    const advancedTab = screen.getByRole('tab', { name: 'Advanced' });
    await userEvent.click(advancedTab);

    // Click the repeating checkbox to enable recurrence
    const recurrenceCheckbox = screen.getByRole('switch', { name: 'Repeating' });
    await userEvent.click(recurrenceCheckbox);

    // Set recurrence values
    const recurrenceInput = screen.getByRole('textbox', { name: 'Repeat every' });
    await userEvent.clear(recurrenceInput);
    await userEvent.type(recurrenceInput, '2');

    const frequencySelect = screen.getByRole('textbox', { name: 'Frequency' });
    await userEvent.click(frequencySelect);
    await userEvent.click(screen.getByRole('option', { name: 'Weeks' }));

    // Chose Tuesday
    const recurrenceDaySelect = screen.getByRole('radio', { name: 'Tues' });
    await userEvent.click(recurrenceDaySelect);

    const submitButton = screen.getByRole('button', { name: 'Create Task' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });

    const tasks = await taskRepository.getTasks({});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Recurring Task');
    expect(tasks[0].recurrence?.interval).toBe(2);
    expect(tasks[0].recurrence?.frequency).toBe('weekly');
    expect(tasks[0].recurrence?.dayOfWeek).toBe(2); // strict equality, this must be a number
  });

  it('Converts recurrence day of month to number', async () => {
    const handleClose = jest.fn();
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    await userEvent.type(titleInput, 'Recurring Task');

    const advancedTab = screen.getByRole('tab', { name: 'Advanced' });
    await userEvent.click(advancedTab);

    // Click the repeating checkbox to enable recurrence
    const recurrenceCheckbox = screen.getByRole('switch', { name: 'Repeating' });
    await userEvent.click(recurrenceCheckbox);

    const frequencySelect = screen.getByRole('textbox', { name: 'Frequency' });
    await userEvent.click(frequencySelect);
    await userEvent.click(screen.getByRole('option', { name: 'Month' }));

    // Chose the 15th day of the month
    const recurrenceDaySelect = screen.getByRole('textbox', { name: 'Day of month' });
    await userEvent.clear(recurrenceDaySelect);
    await userEvent.type(recurrenceDaySelect, '15');

    const submitButton = screen.getByRole('button', { name: 'Create Task' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });

    const tasks = await taskRepository.getTasks({});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Recurring Task');
    expect(tasks[0].recurrence?.interval).toBe(1);
    expect(tasks[0].recurrence?.frequency).toBe('monthly');
    expect(tasks[0].recurrence?.dayOfMonth).toBe(15); // strict equality, this must be a number
  });

  it('Accepts sundays for recurrence day of week', async () => {
    const handleClose = jest.fn();
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    await userEvent.type(titleInput, 'Recurring Task');

    const advancedTab = screen.getByRole('tab', { name: 'Advanced' });
    await userEvent.click(advancedTab);

    // Click the repeating checkbox to enable recurrence
    const recurrenceCheckbox = screen.getByRole('switch', { name: 'Repeating' });
    await userEvent.click(recurrenceCheckbox);

    // Set recurrence values
    const recurrenceInput = screen.getByRole('textbox', { name: 'Repeat every' });
    await userEvent.clear(recurrenceInput);
    await userEvent.type(recurrenceInput, '2');

    const frequencySelect = screen.getByRole('textbox', { name: 'Frequency' });
    await userEvent.click(frequencySelect);
    await userEvent.click(screen.getByRole('option', { name: 'Weeks' }));

    // Chose Tuesday
    const recurrenceDaySelect = screen.getByRole('radio', { name: 'Sun' });
    await userEvent.click(recurrenceDaySelect);

    const submitButton = screen.getByRole('button', { name: 'Create Task' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });

    const tasks = await taskRepository.getTasks({});
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Recurring Task');
    expect(tasks[0].recurrence?.interval).toBe(2);
    expect(tasks[0].recurrence?.frequency).toBe('weekly');
    expect(tasks[0].recurrence?.dayOfWeek).toBe(0); // strict equality, this must be a number
  });

  /*it('Sets the project and tags from the context if available', async () => {
    const handleClose = jest.fn();
    const dataSource = getDataSource();
    const contextRepository = dataSource.getContextRepository();

    const context = await contextRepository.addContext(
      contextFactory({
        filter: {
          requireProjects: ['Test Project'],
          requireTags: ['context-tag'],
        },
      })
    );
    (useRouter as jest.Mock).mockReturnValue({
      query: { context: context._id },
    });

    renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

    // Wait for the form to be populated with context data
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Project' })).toHaveValue('Test Project');
      expect(screen.getByRole('textbox', { name: 'Tags' })).toHaveValue('context-tag');
    });
  });*/
});
