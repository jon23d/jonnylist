import { waitFor } from '@testing-library/react';
import { TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { renderWithDataSource, screen, userEvent } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import NewTaskForm from '../NewTaskForm';

describe('NewTaskForm', () => {
  const { getDataSource } = setupTestDatabase();

  it('Renders the context select with available contexts', async () => {
    const dataSource = getDataSource();
    await dataSource.addContext('Context1');
    await dataSource.addContext('Context2');

    renderWithDataSource(<NewTaskForm handleClose={() => {}} />, dataSource);

    // Wait for the component to load contexts
    const contextSelect = screen.getByRole('textbox', { name: 'Context' });
    await userEvent.click(contextSelect);

    // Mantine Select options appear as text elements, not role="option"
    await waitFor(() => {
      expect(screen.getByText('Context1')).toBeInTheDocument();
    });

    expect(screen.getByText('Context2')).toBeInTheDocument();
  });

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
    await dataSource.addContext('Context1');
    await dataSource.addContext('Context2');

    renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

    const contextSelect = screen.getByRole('textbox', { name: 'Context' });
    await userEvent.click(contextSelect);

    await waitFor(() => {
      userEvent.click(screen.getByText('Context2'));
    });

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

    const submitButton = screen.getByRole('button', { name: 'Save' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });

    const tasks = await dataSource.getTasks({
      statuses: [TaskStatus.Done],
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Test Task');
    expect(tasks[0].description).toBe('This is a test task description.');
    expect(tasks[0].tags).toStrictEqual(['test-tag', 'another-tag']);
    expect(tasks[0].priority).toBe(TaskPriority.Low);
    expect(tasks[0].dueDate).toBe('2026-01-15');
    expect(tasks[0].status).toBe(TaskStatus.Done);
  });

  it('Uses the last selected context as the default value', async () => {
    const dataSource = getDataSource();
    await dataSource.addContext('Context2');
    await dataSource.setPreferences({
      _id: 'preferences',
      type: 'preferences',
      lastSelectedContext: 'Context2',
    });

    renderWithDataSource(<NewTaskForm handleClose={() => {}} />, dataSource);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Context' })).toHaveDisplayValue('Context2');
    });
  });

  it('Blurs the active element when the form is submitted', async () => {
    const handleClose = jest.fn();
    const dataSource = getDataSource();
    await dataSource.addContext('Context1');

    renderWithDataSource(<NewTaskForm handleClose={handleClose} />, dataSource);

    await waitFor(async () => {
      await userEvent.click(screen.getByRole('textbox', { name: 'Context' }));
      await userEvent.click(screen.getByRole('option', { name: 'Context1' }));
    });

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    await userEvent.type(titleInput, 'Test Task');

    const submitButton = screen.getByRole('button', { name: 'Save' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });

    // Check if the active element is blurred
    expect(document.activeElement).not.toBe(submitButton);
  });
});
