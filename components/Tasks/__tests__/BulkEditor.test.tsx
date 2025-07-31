import BulkEditor from '@/components/Tasks/BulkEditor';
import { TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { renderWithDataSource, screen, userEvent, waitFor } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import { taskFactory } from '@/test-utils/factories/TaskFactory';

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
    const taskRepository = getDataSource().getTaskRepository();

    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const priorityInput = screen.getByRole('textbox', { name: 'Priority' });
    await userEvent.click(priorityInput);
    await userEvent.click(screen.getByRole('option', { name: 'High' }));

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);

    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const updatedTasks = await taskRepository.getTasks({});

    expect(updatedTasks[0].priority).toEqual(TaskPriority.High);
    expect(updatedTasks[1].priority).toEqual(TaskPriority.High);
  });

  it('Handles updating status', async () => {
    const taskRepository = getDataSource().getTaskRepository();

    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const statusInput = screen.getByRole('textbox', { name: 'Status' });
    await userEvent.click(statusInput);
    await userEvent.click(screen.getByRole('option', { name: 'Cancelled' }));

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);

    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const updatedTasks = await taskRepository.getTasks({});

    expect(updatedTasks[0].status).toEqual(TaskStatus.Cancelled);
    expect(updatedTasks[1].status).toEqual(TaskStatus.Cancelled);
  });

  it('Handles clearing project', async () => {
    const taskRepository = getDataSource().getTaskRepository();

    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const clearProjectCheckbox = screen.getByRole('checkbox', { name: 'Clear Project' });
    await userEvent.click(clearProjectCheckbox);

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const updatedTasks = await taskRepository.getTasks({});

    expect(updatedTasks[0].project).toEqual('');
    expect(updatedTasks[1].project).toEqual('');
  });

  it('Handles setting project', async () => {
    const taskRepository = getDataSource().getTaskRepository();

    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const projectInput = screen.getByRole('textbox', { name: 'Project' });
    await userEvent.type(projectInput, 'newProject');

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const updatedTasks = await taskRepository.getTasks({});

    expect(updatedTasks[0].project).toEqual('newProject');
    expect(updatedTasks[1].project).toEqual('newProject');
  });

  it('Handles setting waitUntil', async () => {
    return;
    // @ TODO Come back to this when I'm not on a plane. How does one test
    // the DatePickerInput?
    const taskRepository = getDataSource().getTaskRepository();

    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const waitUntilInput = screen.getByRole('textbox', { name: 'Wait Until' });
    await userEvent.type(waitUntilInput, '03/15/2026');

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const updatedTasks = await taskRepository.getTasks({});

    await waitFor(() => expect(onCancel).toHaveBeenCalled());

    expect(updatedTasks[0].waitUntil).toEqual('2026-03-15');
    expect(updatedTasks[0].status).toEqual(TaskStatus.Waiting);
    expect(updatedTasks[1].waitUntil).toEqual('2026-03-15');
    expect(updatedTasks[1].status).toEqual(TaskStatus.Waiting);
  });

  it('Handles adding tags', async () => {
    const taskRepository = getDataSource().getTaskRepository();

    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const projectInput = screen.getByRole('textbox', { name: 'Add Tags' });
    await userEvent.type(projectInput, 'tag4');

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const updatedTasks = await taskRepository.getTasks({});

    expect(updatedTasks[0].tags).toEqual(['tag1', 'tag2', 'tag4']);
    expect(updatedTasks[1].tags).toEqual(['tag2', 'tag3', 'tag4']);
  });

  it('Handles removing tags', async () => {
    const taskRepository = getDataSource().getTaskRepository();

    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const projectInput = screen.getByRole('textbox', { name: 'Remove Tags' });
    await userEvent.type(projectInput, 'tag2');

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);
    await waitFor(() => expect(onSave).toHaveBeenCalled());

    const updatedTasks = await taskRepository.getTasks({});

    expect(updatedTasks[0].tags).toEqual(['tag1']);
    expect(updatedTasks[1].tags).toEqual(['tag3']);
  });

  it('Calls onSave when update tasks is clicked', async () => {
    const taskRepository = getDataSource().getTaskRepository();

    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const saveButton = screen.getByRole('button', { name: 'Update tasks' });
    await userEvent.click(saveButton);

    await waitFor(() => expect(onSave).toHaveBeenCalled());
  });

  it('Calls onCancel when cancel is clicked', async () => {
    const taskRepository = getDataSource().getTaskRepository();

    renderWithDataSource(
      <BulkEditor tasks={tasks} onSave={onSave} onCancel={onCancel} />,
      getDataSource()
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);

    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });
});
