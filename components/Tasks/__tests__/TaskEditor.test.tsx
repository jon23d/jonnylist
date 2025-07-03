import TaskEditor from '@/components/Tasks/TaskEditor';
import { TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { renderWithDataSource, screen, userEvent, waitFor } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import { taskFactory } from '@/test-utils/factories/TaskFactory';

const updateTaskMock = jest.fn();
const getContextsMock = jest.fn().mockResolvedValue(['context1', 'context2']);

const mockContextRepository = {
  getContexts: getContextsMock,
};
const mockTaskRepository = {
  updateTask: updateTaskMock,
};
jest.mock('@/contexts/DataSourceContext', () => ({
  ...jest.requireActual('@/contexts/DataSourceContext'),
  useTaskRepository: () => mockTaskRepository,
  useContextRepository: () => mockContextRepository,
}));

describe('TaskEditor', () => {
  const { getDataSource } = setupTestDatabase();

  it('Renders the public fields of a task in a form', async () => {
    const dataSource = getDataSource();

    const task = taskFactory({
      status: TaskStatus.Ready,
      context: 'context1',
      dueDate: '2023-08-30',
      priority: TaskPriority.High,
    });

    renderWithDataSource(<TaskEditor task={task} handleClose={() => {}} />, dataSource);

    // We must wait for the contexts to be fetched before we can check the form
    await waitFor(() => {
      const contextInput = screen.getByRole('textbox', { name: 'Context' });
      expect(contextInput).toBeInTheDocument();
      expect(contextInput).toHaveValue(task.context);
    });

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    expect(titleInput).toBeInTheDocument();
    expect(titleInput).toHaveValue(task.title);

    const descriptionInput = screen.getByRole('textbox', { name: 'Description' });
    expect(descriptionInput).toBeInTheDocument();
    expect(descriptionInput).toHaveValue(task.description);

    const priorityInput = screen.getByRole('textbox', { name: 'Priority' });
    expect(priorityInput).toBeInTheDocument();
    expect(priorityInput).toHaveValue('High');

    const dueDateInput = screen.getByRole('textbox', { name: 'Due Date' });
    expect(dueDateInput).toBeInTheDocument();
    expect(dueDateInput).toHaveValue('August 30, 2023');

    const statusInput = screen.getByRole('textbox', { name: 'Status' });
    expect(statusInput).toBeInTheDocument();
    expect(statusInput).toHaveValue('Ready');
  });

  it('fetches contexts and populates the Context select input', async () => {
    const dataSource = getDataSource();
    const task = taskFactory(); // Context value doesn't matter for this test
    renderWithDataSource(<TaskEditor task={task} handleClose={() => {}} />, dataSource);

    // Assert that getContexts was called when the component mounted
    expect(getContextsMock).toHaveBeenCalledTimes(1);
  });

  it('Saves the task when the form is submitted', async () => {
    const task = taskFactory();
    const dataSource = getDataSource();
    renderWithDataSource(<TaskEditor task={task} handleClose={() => {}} />, dataSource);

    // Wait for contexts to be fetched
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Context' })).toBeInTheDocument();
    });

    const titleInput = screen.getByRole('textbox', { name: 'Title' });
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Task Title');

    const descriptionInput = screen.getByRole('textbox', { name: 'Description' });
    await userEvent.clear(descriptionInput);
    await userEvent.type(descriptionInput, 'Updated Task Description');

    const priorityInput = screen.getByRole('textbox', { name: 'Priority' });
    await userEvent.type(priorityInput, 'Medium');

    const dueDateInput = screen.getByRole('textbox', { name: 'Due Date' });
    await userEvent.clear(dueDateInput);
    await userEvent.type(dueDateInput, '2023-10-15');

    const statusInput = screen.getByRole('textbox', { name: 'Status' });
    await userEvent.click(statusInput);
    await userEvent.click(screen.getByRole('option', { name: 'Started' }));

    const tagsInput = screen.getByRole('textbox', { name: 'Tags' });
    await userEvent.type(tagsInput, 'tag1{enter}tag2{enter}');

    const projectInput = screen.getByRole('textbox', { name: 'Project' });
    await userEvent.clear(projectInput);
    await userEvent.type(projectInput, 'Updated Project');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    // Assert that updateTask was called with the updated values
    expect(updateTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: task._id,
        context: task.context,
        title: 'Updated Task Title',
        description: 'Updated Task Description',
        priority: TaskPriority.Medium,
        dueDate: '2023-10-15',
        status: TaskStatus.Started,
        project: 'Updated Project',
        tags: ['tag1', 'tag2'],
      })
    );
  });

  it('blurs the active element after saving', async () => {
    const task = taskFactory();
    const dataSource = getDataSource();
    renderWithDataSource(<TaskEditor task={task} handleClose={() => {}} />, dataSource);

    // Wait for contexts to be fetched
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Context' })).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    expect(document.activeElement).not.toBe(saveButton);
  });
});
