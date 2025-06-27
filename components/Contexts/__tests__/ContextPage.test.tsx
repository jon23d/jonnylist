import ContextPage from '@/components/Contexts/ContextPage';
import { DataSource } from '@/data/DataSource';
import { renderWithDataSource, screen, userEvent, waitFor } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import { PreferencesFactory } from '@/test-utils/factories/PreferencesFactory';

jest.mock('@/components/Contexts/Views/Board/Board', () => () => <div>Board View</div>);
jest.mock('@/components/Contexts/Views/List/List', () => () => <div>List View</div>);
jest.mock('@/components/Contexts/Views/Calendar/Calendar', () => () => <div>Calendar View</div>);

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('ContextPage', () => {
  const { getDataSource } = setupTestDatabase();
  let dataSource: DataSource;
  let subscribeToTasks: jest.SpyInstance;
  let getPreferences: jest.SpyInstance;
  const unsubscribeFunction = jest.fn();

  beforeEach(() => {
    dataSource = getDataSource();

    subscribeToTasks = jest
      .spyOn(dataSource, 'subscribeToTasks')
      .mockReturnValue(unsubscribeFunction);

    getPreferences = jest.spyOn(dataSource, 'getPreferences').mockResolvedValue(
      new PreferencesFactory().create({
        lastSelectedContext: 'Test Context',
      })
    );
  });

  afterEach(async () => {
    subscribeToTasks.mockRestore();
    getPreferences.mockRestore();
  });

  it('Subscribes to tasks with the correct parameters', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />, dataSource);

    // The view selector needs to be loaded so that this test doesn't cause issues
    await screen.findByRole('radio', { name: 'List' });

    expect(subscribeToTasks).toHaveBeenCalledWith(
      {
        statuses: ['ready'],
        context: 'Test Context',
      },
      expect.any(Function)
    );
  });

  it('Re-subscribes to tasks when the status selector is invoked', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />, dataSource);

    // The view selector needs to be loaded so that this test doesn't cause issues
    await screen.findByRole('radio', { name: 'List' });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Started' }));

    expect(unsubscribeFunction).toHaveBeenCalled();
    expect(subscribeToTasks).toHaveBeenCalledWith(
      {
        statuses: ['ready', 'started'],
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
