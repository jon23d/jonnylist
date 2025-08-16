import { DateInput } from '@mantine/dates';
import EditTaskForm from '@/components/Tasks/EditTaskForm';
import { TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { setupTestDatabase } from '@/test-utils/db';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { renderWithDataSource, screen, userEvent } from '@/test-utils/index';

const updateTaskMock = vi.fn();

const mockTaskRepository = {
  updateTask: updateTaskMock,
};
vi.mock('@/contexts/DataSourceContext', async () => {
  const actual = await import('@/contexts/DataSourceContext');
  return {
    ...actual,
    useTaskRepository: () => mockTaskRepository,
  };
});

// The DatePickerInput is not very testable, so we are going to use the DatePicker input in test instead
vi.mock('@mantine/dates', async () => {
  const actual = await import('@mantine/dates');
  return {
    ...actual,
    DatePickerInput: vi.fn(({ ...props }) => <DateInput {...props} />),
  };
});

describe('EditTaskForm', () => {
  const { getDataSource } = setupTestDatabase();

  describe('form submission', () => {
    it('saves basic task fields', async () => {
      const task = taskFactory();
      const dataSource = getDataSource();
      renderWithDataSource(<EditTaskForm task={task} handleClose={() => {}} />, dataSource);

      const titleInput = screen.getByRole('textbox', { name: 'Title' });
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Updated Task Title');

      const saveButton = screen.getByRole('button', { name: /Save task/i });
      await userEvent.click(saveButton);

      expect(updateTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: task._id,
          title: 'Updated Task Title',
        })
      );
    });

    it('saves priority and due date', async () => {
      const task = taskFactory();
      const dataSource = getDataSource();
      renderWithDataSource(<EditTaskForm task={task} handleClose={() => {}} />, dataSource);

      const priorityInput = screen.getByRole('textbox', { name: 'Priority' });
      await userEvent.type(priorityInput, 'Medium');

      const dueDateInput = screen.getByRole('textbox', { name: 'Due Date' });
      await userEvent.clear(dueDateInput);
      await userEvent.type(dueDateInput, '2023-10-15');

      const saveButton = screen.getByRole('button', { name: /Save task/i });
      await userEvent.click(saveButton);

      expect(updateTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: TaskPriority.Medium,
          dueDate: '2023-10-15',
        })
      );
    });

    it('saves status and tags', async () => {
      const task = taskFactory();
      const dataSource = getDataSource();
      renderWithDataSource(<EditTaskForm task={task} handleClose={() => {}} />, dataSource);

      const statusInput = screen.getByRole('textbox', { name: 'Status' });
      await userEvent.click(statusInput);
      await userEvent.click(screen.getByRole('option', { name: 'Started' }));

      const tagsInput = screen.getByRole('textbox', { name: 'Tags' });
      await userEvent.type(tagsInput, 'tag1{enter}tag2{enter}');

      const saveButton = screen.getByRole('button', { name: /Save task/i });
      await userEvent.click(saveButton);

      expect(updateTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TaskStatus.Started,
          tags: ['tag1', 'tag2'],
        })
      );
    });

    it('saves advanced fields', async () => {
      const task = taskFactory();
      const dataSource = getDataSource();
      renderWithDataSource(<EditTaskForm task={task} handleClose={() => {}} />, dataSource);

      const advancedTab = screen.getByRole('tab', { name: 'Advanced' });
      await userEvent.click(advancedTab);

      const descriptionInput = screen.getByRole('textbox', { name: 'Description' });
      await userEvent.clear(descriptionInput);
      await userEvent.type(descriptionInput, 'Updated Description');

      const waitUntilInput = screen.getByRole('textbox', { name: 'Wait Until' });
      await userEvent.type(waitUntilInput, '03/01/2027');

      const saveButton = screen.getByRole('button', { name: /Save task/i });
      await userEvent.click(saveButton);

      expect(updateTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Updated Description',
          waitUntil: '2027-03-01',
          status: TaskStatus.Waiting, // Should auto-set to Waiting when waitUntil is set
        })
      );
    });
  });

  it('blurs the active element after saving', async () => {
    const task = taskFactory();
    const dataSource = getDataSource();
    renderWithDataSource(<EditTaskForm task={task} handleClose={() => {}} />, dataSource);

    const saveButton = screen.getByRole('button', { name: /save task/i });
    await userEvent.click(saveButton);

    expect(document.activeElement).not.toBe(saveButton);
  });

  it('blurs the active element after saving', async () => {
    const task = taskFactory();
    const dataSource = getDataSource();
    renderWithDataSource(<EditTaskForm task={task} handleClose={() => {}} />, dataSource);

    const saveButton = screen.getByRole('button', { name: /save task/i });
    await userEvent.click(saveButton);

    expect(document.activeElement).not.toBe(saveButton);
  });
});
