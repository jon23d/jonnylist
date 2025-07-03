import ContextPage from '@/components/Contexts/ContextPage';
import { DataSource } from '@/data/DataSource';
import { TaskStatus } from '@/data/documentTypes/Task';
import { TaskRepository } from '@/data/TaskRepository';
import { renderWithDataSource, screen, userEvent, waitFor } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import { preferencesFactory } from '@/test-utils/factories/PreferencesFactory';

jest.mock('@/components/Contexts/Views/Board/Board', () => () => <div>Board View</div>);
jest.mock('@/components/Contexts/Views/List/List', () => () => <div>List View</div>);
jest.mock('@/components/Contexts/Views/Calendar/Calendar', () => () => <div>Calendar View</div>);

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('ContextPage', () => {
  const { getDataSource } = setupTestDatabase();
  let dataSource: DataSource;
  let taskRepository: TaskRepository;

  let subscribeToTasks: jest.SpyInstance;
  const unsubscribeFunction = jest.fn();

  beforeEach(() => {
    dataSource = getDataSource();
    taskRepository = dataSource.getTaskRepository();

    subscribeToTasks = jest
      .spyOn(taskRepository, 'subscribeToTasks')
      .mockReturnValue(unsubscribeFunction);
  });

  it('Subscribes to tasks with the correct parameters', async () => {
    jest.spyOn(dataSource, 'getPreferences').mockResolvedValue(
      preferencesFactory({
        lastSelectedContext: 'Test Context',
        lastSelectedStatuses: [TaskStatus.Ready],
      })
    );

    renderWithDataSource(<ContextPage contextName="Test Context" />, dataSource);

    await waitFor(() => {
      expect(subscribeToTasks).toHaveBeenCalledWith(
        {
          statuses: [TaskStatus.Ready],
          context: 'Test Context',
        },
        expect.any(Function)
      );
    });
  });

  it('Re-subscribes to tasks when the status selector is invoked', async () => {
    jest.spyOn(dataSource, 'getPreferences').mockResolvedValue(
      preferencesFactory({
        lastSelectedContext: 'Test Context',
        lastSelectedStatuses: [TaskStatus.Ready],
      })
    );

    renderWithDataSource(<ContextPage contextName="Test Context" />, dataSource);

    // The view selector needs to be loaded so that this test doesn't cause issues
    await screen.findByRole('radio', { name: 'List' });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Started' }));

    expect(unsubscribeFunction).toHaveBeenCalled();
    expect(subscribeToTasks).toHaveBeenCalledWith(
      {
        statuses: [TaskStatus.Started, TaskStatus.Ready],
        context: 'Test Context',
      },
      expect.any(Function)
    );
  });

  it('Loads the list view by default', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />, dataSource);

    // The view selector needs to be loaded so that this test doesn't cause issues
    await screen.findByRole('radio', { name: 'List' });

    await waitFor(() => {
      expect(screen.getByText('List View')).toBeInTheDocument();
    });
  });

  it('Remembers and re-uses the statuses selected', async () => {
    jest.spyOn(dataSource, 'getPreferences').mockResolvedValue(
      preferencesFactory({
        lastSelectedContext: 'Test Context',
        lastSelectedStatuses: [TaskStatus.Ready],
      })
    );

    // Render with the just the Ready status selected
    renderWithDataSource(<ContextPage contextName="context1" />, dataSource);

    await waitFor(() => {
      expect(subscribeToTasks).toHaveBeenCalledWith(
        {
          statuses: [TaskStatus.Ready],
          context: 'context1',
        },
        expect.any(Function)
      );
    });

    // Now select the Waiting status
    await userEvent.click(screen.getByRole('checkbox', { name: 'Waiting' }));

    await waitFor(() => {
      expect(subscribeToTasks).toHaveBeenCalledWith(
        {
          statuses: [TaskStatus.Waiting, TaskStatus.Ready],
          context: 'context1',
        },
        expect.any(Function)
      );
    });

    // Now we can completely re-render the component
    renderWithDataSource(<ContextPage contextName="context1" />, dataSource);

    // And we should expect the same statuses to be used
    await waitFor(() => {
      expect(subscribeToTasks).toHaveBeenCalledWith(
        {
          statuses: [TaskStatus.Waiting, TaskStatus.Ready],
          context: 'context1',
        },
        expect.any(Function)
      );
    });
  });

  // This is commented out until we support the additional views
  /*it('Navigates to the list view after loading another', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />, dataSource);

    await userEvent.click(screen.getByRole('radio', { name: 'Board' }));
    expect(screen.getByText('Board View')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'List' }));
    expect(screen.getByText('List View')).toBeInTheDocument();
  });*/

  // The following test is commented out because the Board view is not implemented yet.
  /*it('Loads the board view', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />, dataSource);

    await userEvent.click(screen.getByRole('radio', { name: 'Board' }));

    expect(screen.getByText('Board View')).toBeInTheDocument();
  });*/

  // The following test is commented out because the Calendar view is not implemented yet.
  /*it('Loads the calendar view', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />, dataSource);

    await userEvent.click(screen.getByRole('radio', { name: 'Board' }));

    expect(screen.getByText('Board View')).toBeInTheDocument();
  });*/
});
