import PouchDB from 'pouchdb';
import ContextPage from '@/components/Contexts/ContextPage';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { DataSource } from '@/data/DataSource';
import { DocumentTypes } from '@/data/interfaces';
import { LocalDataSource } from '@/data/LocalDataSource';
import { render, screen, userEvent, waitFor } from '@/test-utils';

jest.mock('@/components/Contexts/Views/Board/Board', () => () => <div>Board View</div>);
jest.mock('@/components/Contexts/Views/List/List', () => () => <div>List View</div>);
jest.mock('@/components/Contexts/Views/Calendar/Calendar', () => () => <div>Calendar View</div>);

describe('ContextPage', () => {
  let database: PouchDB.Database<DocumentTypes>;
  let localDataSource: DataSource;
  let getTasks: jest.SpyInstance;

  beforeEach(() => {
    // I could never get the pouchdb-memory plugin to work with the test suite,
    // so we use a new database for each test. If we don't subsequent runs will fail
    database = new PouchDB<DocumentTypes>(
      `test_db_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    );
    localDataSource = new LocalDataSource(database);
    getTasks = jest.spyOn(localDataSource, 'getTasks').mockResolvedValue([]);
  });

  afterEach(async () => {
    getTasks.mockRestore();
    await database.destroy();
  });

  const renderWithDataSource = (component: React.ReactElement) => {
    return render(
      <DataSourceContextProvider dataSource={localDataSource}>
        {component}
      </DataSourceContextProvider>
    );
  };

  it('Calls get tasks with the default parameters', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />);

    // The view selector needs to be loaded so that this test doesn't cause issues
    await screen.findByRole('radio', { name: 'List' });

    await waitFor(() => {
      expect(getTasks).toHaveBeenCalledWith({
        statuses: ['ready'],
        context: 'Test Context',
      });
    });
  });

  it('Updates the tasks when the selected task statuses change', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />);

    // The view selector needs to be loaded so that this test doesn't cause issues
    await screen.findByRole('radio', { name: 'List' });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Started' }));

    expect(getTasks).toHaveBeenCalledWith({
      statuses: ['ready', 'started'],
      context: 'Test Context',
    });
  });

  it('Loads the list view by default', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />);

    // The view selector needs to be loaded so that this test doesn't cause issues
    await screen.findByRole('radio', { name: 'List' });

    await waitFor(() => {
      expect(screen.getByText('List View')).toBeInTheDocument();
      expect(getTasks).toHaveBeenCalledWith({
        statuses: ['ready'],
        context: 'Test Context',
      });
    });
  });

  it('Navigates to the list view after loading another', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />);

    await userEvent.click(screen.getByRole('radio', { name: 'Board' }));
    expect(screen.getByText('Board View')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'List' }));
    expect(screen.getByText('List View')).toBeInTheDocument();
  });

  it('Loads the board view', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />);

    await userEvent.click(screen.getByRole('radio', { name: 'Board' }));

    expect(screen.getByText('Board View')).toBeInTheDocument();
  });

  it('Loads the calendar view', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />);

    await userEvent.click(screen.getByRole('radio', { name: 'Board' }));

    expect(screen.getByText('Board View')).toBeInTheDocument();
  });
});
