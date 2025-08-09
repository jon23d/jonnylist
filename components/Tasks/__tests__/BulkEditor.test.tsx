import BulkEditor from '@/components/Tasks/BulkEditor';
import { TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { renderWithDataSource, screen, userEvent, waitFor } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import { taskFactory } from '@/test-utils/factories/TaskFactory';

const updateTaskMock = jest.fn();
const mockTaskRepository = {
  updateTask: updateTaskMock,
};
jest.mock('@/contexts/DataSourceContext', () => ({
  ...jest.requireActual('@/contexts/DataSourceContext'),
  useTaskRepository: () => mockTaskRepository,
}));

describe('BulkEditor', () => {
  const { getDataSource } = setupTestDatabase();
  const onSave = jest.fn();
  const onCancel = jest.fn();

  const tasks = [
    taskFactory({
      _id: 'task-1',
      project: 'project1',
      tags: ['tag1', 'tag2'],
      status: TaskStatus.Ready,
    }),
    taskFactory({
      _id: 'task-2',
      project: 'project2',
      tags: ['tag2', 'tag3'],
      status: TaskStatus.Started,
    }),
  ];

  beforeEach(async () => {
    const taskRepository = getDataSource().getTaskRepository();
    await Promise.all(tasks.map((task) => taskRepository.addTask(task)));
  });

  it('Handles updating priority', async () => {
    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const priorityInput = screen.getByRole('textbox', { name: 'Priority' });
    await userEvent.click(priorityInput);
    await userEvent.click(screen.getByRole('option', { name: 'High' }));

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);

    expect(updateTaskMock).toHaveBeenCalledTimes(2);
    expect(updateTaskMock.mock.calls).toEqual(
      expect.arrayContaining([
        [expect.objectContaining({ _id: 'task-1', priority: TaskPriority.High })],
        [expect.objectContaining({ _id: 'task-2', priority: TaskPriority.High })],
      ])
    );
  });

  it('Handles updating status', async () => {
    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const statusInput = screen.getByRole('textbox', { name: 'Status' });
    await userEvent.click(statusInput);
    await userEvent.click(screen.getByRole('option', { name: 'Cancelled' }));

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);

    expect(updateTaskMock).toHaveBeenCalledTimes(2);
    expect(updateTaskMock.mock.calls).toEqual(
      expect.arrayContaining([
        [expect.objectContaining({ _id: 'task-1', status: TaskStatus.Cancelled })],
        [expect.objectContaining({ _id: 'task-2', status: TaskStatus.Cancelled })],
      ])
    );
  });

  it('Handles clearing project', async () => {
    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const clearProjectCheckbox = screen.getByRole('checkbox', { name: 'Clear Project' });
    await userEvent.click(clearProjectCheckbox);

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);

    expect(updateTaskMock).toHaveBeenCalledTimes(2);
    expect(updateTaskMock.mock.calls).toEqual(
      expect.arrayContaining([
        [expect.objectContaining({ _id: 'task-1', project: '' })],
        [expect.objectContaining({ _id: 'task-2', project: '' })],
      ])
    );
  });

  it('Handles setting project', async () => {
    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const projectInput = screen.getByRole('textbox', { name: 'Project' });
    await userEvent.type(projectInput, 'newProject');

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);

    expect(updateTaskMock).toHaveBeenCalledTimes(2);
    expect(updateTaskMock.mock.calls).toEqual(
      expect.arrayContaining([
        [expect.objectContaining({ _id: 'task-1', project: 'newProject' })],
        [expect.objectContaining({ _id: 'task-2', project: 'newProject' })],
      ])
    );
  });

  it('Handles adding tags', async () => {
    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const projectInput = screen.getByRole('textbox', { name: 'Add Tags' });
    await userEvent.type(projectInput, 'tag4');

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);

    expect(updateTaskMock).toHaveBeenCalledTimes(2);
    expect(updateTaskMock.mock.calls).toEqual(
      expect.arrayContaining([
        [expect.objectContaining({ _id: 'task-1', tags: ['tag1', 'tag2', 'tag4'] })],
        [expect.objectContaining({ _id: 'task-2', tags: ['tag2', 'tag3', 'tag4'] })],
      ])
    );
  });

  it('Handles removing tags', async () => {
    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const projectInput = screen.getByRole('textbox', { name: 'Remove Tags' });
    await userEvent.type(projectInput, 'tag2');

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);

    expect(updateTaskMock).toHaveBeenCalledTimes(2);
    expect(updateTaskMock.mock.calls).toEqual(
      expect.arrayContaining([
        [expect.objectContaining({ _id: 'task-1', tags: ['tag1'] })],
        [expect.objectContaining({ _id: 'task-2', tags: ['tag3'] })],
      ])
    );
  });

  it('Calls onSave when update tasks is clicked', async () => {
    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);

    await waitFor(() => expect(onSave).toHaveBeenCalled());
  });

  it('Calls onCancel when cancel is clicked', async () => {
    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);

    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });
});
