import { waitFor } from '@testing-library/react';
import { TaskStatus } from '@/data/documentTypes/Task';
import { renderWithDataSource, screen, userEvent } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import NewTaskForm from '../NewTaskForm';

describe('NewTaskForm', () => {
  const { getDataSource } = setupTestDatabase();

  it('Renders the context select with available contexts', async () => {
    const dataSource = getDataSource();

    renderWithDataSource(
      <NewTaskForm handleClose={() => {}} contexts={['Context1', 'Context2']} />,
      dataSource
    );

    const contextSelect = screen.getByRole('textbox', { name: 'Context' });
    await userEvent.click(contextSelect);

    expect(screen.getByRole('option', { name: 'Context1' })).toBeInTheDocument();
    expect(screen.getByText('Context2')).toBeInTheDocument();
  });

  it('Renders the status select with task status options', async () => {
    renderWithDataSource(<NewTaskForm handleClose={() => {}} contexts={[]} />, getDataSource());

    const statusSelect = screen.getByRole('textbox', { name: 'Status' });
    await userEvent.click(statusSelect);

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('Saves a new task when the form is submitted', async () => {
    const handleClose = jest.fn();
    const dataSource = getDataSource();

    renderWithDataSource(
      <NewTaskForm handleClose={handleClose} contexts={['Context1', 'Context2']} />,
      dataSource
    );

    const contextSelect = screen.getByRole('textbox', { name: 'Context' });
    await userEvent.click(contextSelect);
    await userEvent.click(screen.getByText('Context2'));

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    await userEvent.type(titleInput, 'Test Task');

    const descriptionInput = screen.getByRole('textbox', { name: 'Description' });
    await userEvent.type(descriptionInput, 'This is a test task description.');

    const priorityInput = screen.getByRole('textbox', { name: 'Priority' });
    await userEvent.type(priorityInput, '5');

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
    expect(tasks[0].priority).toBe(5);
    expect(tasks[0].dueDate).toBe('2026-01-15');
    expect(tasks[0].status).toBe(TaskStatus.Done);
  });

  it('Uses the last selected context as the default value', async () => {
    const dataSource = getDataSource();
    await dataSource.setPreferences({
      _id: 'preferences',
      type: 'preferences',
      lastSelectedContext: 'Context2',
    });

    renderWithDataSource(
      <NewTaskForm handleClose={() => {}} contexts={['Context1', 'Context2']} />,
      dataSource
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Context' })).toHaveDisplayValue('Context2');
    });
  });
});
