import StatusChanger from '@/components/Tasks/StatusChanger';
import { TaskStatus } from '@/data/documentTypes/Task';
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

describe('StatusChanger', () => {
  const { getDataSource } = setupTestDatabase();

  it('Shows the green clock icon when task is started', async () => {
    const task = taskFactory({ status: TaskStatus.Started });

    renderWithDataSource(<StatusChanger task={task} />, getDataSource());

    const icon = screen.getByLabelText('Change task status');

    await waitFor(() => expect(icon).toBeInTheDocument());
  });

  describe('A started task', () => {
    it('Changes status to Ready when clicked', async () => {
      const task = taskFactory({ status: TaskStatus.Started });

      renderWithDataSource(<StatusChanger task={task} />, getDataSource());

      const icon = screen.getByLabelText('Change task status');
      await userEvent.click(icon);

      const readyOption = screen.getByRole('menuitem', { name: 'Ready' });
      await userEvent.click(readyOption);

      expect(updateTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: task._id,
          status: TaskStatus.Ready,
        })
      );
    });

    it('Changes status to Done when clicked', async () => {
      const task = taskFactory({ status: TaskStatus.Started });

      renderWithDataSource(<StatusChanger task={task} />, getDataSource());

      const icon = screen.getByLabelText('Change task status');
      await userEvent.click(icon);

      const completeOption = screen.getByRole('menuitem', { name: 'Complete' });
      await userEvent.click(completeOption);

      expect(updateTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: task._id,
          status: TaskStatus.Done,
        })
      );
    });

    it('Changes status to Cancelled when clicked', async () => {
      const task = taskFactory({ status: TaskStatus.Started });

      renderWithDataSource(<StatusChanger task={task} />, getDataSource());

      const icon = screen.getByLabelText('Change task status');
      await userEvent.click(icon);

      const cancelOption = screen.getByRole('menuitem', { name: 'Cancel' });
      await userEvent.click(cancelOption);

      expect(updateTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: task._id,
          status: TaskStatus.Cancelled,
        })
      );
    });
  });

  describe('A ready task', () => {
    it('Changes status to Started when clicked', async () => {
      const task = taskFactory({ status: TaskStatus.Ready });

      renderWithDataSource(<StatusChanger task={task} />, getDataSource());

      const icon = screen.getByLabelText('Change task status');
      await userEvent.click(icon);

      const completeOption = screen.getByRole('menuitem', { name: 'Start' });
      await userEvent.click(completeOption);

      expect(updateTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: task._id,
          status: TaskStatus.Started,
        })
      );
    });

    it('Changes status to Done when clicked', async () => {
      const task = taskFactory({ status: TaskStatus.Ready });

      renderWithDataSource(<StatusChanger task={task} />, getDataSource());

      const icon = screen.getByLabelText('Change task status');
      await userEvent.click(icon);

      const completeOption = screen.getByRole('menuitem', { name: 'Complete' });
      await userEvent.click(completeOption);

      expect(updateTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: task._id,
          status: TaskStatus.Done,
        })
      );
    });

    it('Changes status to Cancelled when clicked', async () => {
      const task = taskFactory({ status: TaskStatus.Ready });

      renderWithDataSource(<StatusChanger task={task} />, getDataSource());

      const icon = screen.getByLabelText('Change task status');
      await userEvent.click(icon);

      const cancelOption = screen.getByRole('menuitem', { name: 'Cancel' });
      await userEvent.click(cancelOption);

      expect(updateTaskMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: task._id,
          status: TaskStatus.Cancelled,
        })
      );
    });
  });
});
