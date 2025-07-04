import { waitFor } from '@testing-library/react';
import { TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { renderWithDataSource, screen, userEvent } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import NewTaskForm from '../NewTaskForm';

describe('NewTaskForm', () => {
  const { getDataSource } = setupTestDatabase();

  it('Renders the status select with task status options', async () => {
    renderWithDataSource(<NewTaskForm handleClose={() => {}} />, getDataSource());

    const statusSelect = screen.getByRole('textbox', { name: 'Status' });
    await userEvent.click(statusSelect);

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('Saves a new task when the form is submitted', async () => {
    const handleClose = jest.fn();
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    await userEvent.type(titleInput, 'Test Task');

    const descriptionInput = screen.getByRole('textbox', { name: 'Description' });
    await userEvent.type(descriptionInput, 'This is a test task description.');

    const tagsInput = screen.getByRole('textbox', { name: 'Tags' });
    await userEvent.type(tagsInput, 'test-tag{enter}');
    await userEvent.type(tagsInput, 'another-tag{enter}');

    await userEvent.click(screen.getByRole('textbox', { name: 'Priority' }));
    await userEvent.click(screen.getByRole('option', { name: 'Low' }));

    const dueDateInput = screen.getByRole('textbox', { name: 'Due Date' });
    await userEvent.type(dueDateInput, '01/15/2026');

    const statusSelect = screen.getByRole('textbox', { name: 'Status' });
    await userEvent.click(statusSelect);
    await userEvent.click(screen.getByText('Done'));

    const projectInput = screen.getByRole('textbox', { name: 'Project' });
    await userEvent.type(projectInput, 'Test Project');

    const submitButton = screen.getByRole('button', { name: 'Save' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });

    const tasks = await taskRepository.getTasks({
      statuses: [TaskStatus.Done],
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test Task');
    expect(tasks[0].description).toBe('This is a test task description.');
    expect(tasks[0].tags).toStrictEqual(['test-tag', 'another-tag']);
    expect(tasks[0].priority).toBe(TaskPriority.Low);
    expect(tasks[0].dueDate).toBe('2026-01-15');
    expect(tasks[0].status).toBe(TaskStatus.Done);
    expect(tasks[0].project).toBe('Test Project');
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
});
