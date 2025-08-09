import { waitFor } from '@testing-library/react';
import { DateInput } from '@mantine/dates';
import { TaskPriority } from '@/data/documentTypes/Task';
import { renderWithDataSource, screen, userEvent } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import NewTaskForm from '../NewTaskForm';

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    query: {},
  }),
}));

const addTaskMock = jest.fn();

const mockTaskRepository = {
  addTask: addTaskMock,
};
jest.mock('@/contexts/DataSourceContext', () => ({
  ...jest.requireActual('@/contexts/DataSourceContext'),
  useTaskRepository: () => mockTaskRepository,
}));

// The DatePickerInput is not very testable, so we are going to use the DatePicker input in test instead
jest.mock('@mantine/dates', () => ({
  ...jest.requireActual('@mantine/dates'),
  DatePickerInput: jest.fn(({ ...props }) => <DateInput {...props} />),
}));

describe('NewTaskForm', () => {
  const { getDataSource } = setupTestDatabase();

  describe('Form Submission', () => {
    it('Saves a new task when the form is submitted', async () => {
      const handleClose = jest.fn();
      const dataSource = getDataSource();

      renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

      const titleInput = screen.getByRole('textbox', { name: 'Title' });
      await userEvent.type(titleInput, 'Test Task');

      const tagsInput = screen.getByRole('textbox', { name: 'Tags' });
      await userEvent.type(tagsInput, 'test-tag{enter}');
      await userEvent.type(tagsInput, 'another-tag{enter}');

      await userEvent.click(screen.getByRole('textbox', { name: 'Priority' }));
      await userEvent.click(screen.getByRole('option', { name: 'Low' }));

      const submitButton = screen.getByRole('button', { name: 'Save Task' });
      await userEvent.click(submitButton);

      expect(addTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Task',
          tags: ['test-tag', 'another-tag'],
          priority: TaskPriority.Low,
        })
      );
    });

    it('Saves a new task when the form is submitted', async () => {
      const handleClose = jest.fn();
      const dataSource = getDataSource();

      renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

      const titleInput = screen.getByRole('textbox', { name: 'Title' });
      await userEvent.type(titleInput, 'Test Task');

      const dueDateInput = screen.getByRole('textbox', { name: 'Due Date' });
      await userEvent.type(dueDateInput, '01/15/2026');

      const projectInput = screen.getByRole('textbox', { name: 'Project' });
      await userEvent.type(projectInput, 'Test Project');

      const submitButton = screen.getByRole('button', { name: 'Save Task' });
      await userEvent.click(submitButton);

      expect(addTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Task',
          dueDate: '2026-01-15',
          project: 'Test Project',
        })
      );
    });

    it('Saves a new task when the form is submitted', async () => {
      const handleClose = jest.fn();
      const dataSource = getDataSource();

      renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

      const titleInput = screen.getByRole('textbox', { name: 'Title' });
      await userEvent.type(titleInput, 'Test Task');

      const advancedTab = screen.getByRole('tab', { name: 'Advanced' });
      await userEvent.click(advancedTab);

      const descriptionInput = screen.getByRole('textbox', { name: 'Description' });
      await userEvent.type(descriptionInput, 'This is a test task description.');

      const submitButton = screen.getByRole('button', { name: 'Save Task' });
      await userEvent.click(submitButton);

      expect(addTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Task',
          description: 'This is a test task description.',
        })
      );
    });
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

    const submitButton = screen.getByRole('button', { name: 'Save Task' });
    await userEvent.click(submitButton);

    expect(addTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Recurring Task',
        recurrence: expect.objectContaining({
          interval: 2,
          frequency: 'weekly',
          dayOfWeek: 2,
        }),
      })
    );
  });

  it('Converts recurrence day of month to number', async () => {
    const handleClose = jest.fn();
    const dataSource = getDataSource();

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

    const submitButton = screen.getByRole('button', { name: 'Save Task' });
    await userEvent.click(submitButton);

    expect(addTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Recurring Task',
        recurrence: expect.objectContaining({
          interval: 1,
          frequency: 'monthly',
          dayOfMonth: 15,
        }),
      })
    );
  });

  it('Accepts sundays for recurrence day of week', async () => {
    const handleClose = jest.fn();
    const dataSource = getDataSource();

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

    const submitButton = screen.getByRole('button', { name: 'Save Task' });
    await userEvent.click(submitButton);

    expect(addTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Recurring Task',
        recurrence: expect.objectContaining({
          interval: 2,
          frequency: 'weekly',
          dayOfWeek: 0,
        }),
      })
    );
  });
});
