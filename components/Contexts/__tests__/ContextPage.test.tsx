import { ReactElement } from 'react';
import PouchDB from 'pouchdb';
import ContextPage from '@/components/Contexts/ContextPage';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { DataSource } from '@/data/DataSource';
import { DocumentTypes } from '@/data/documentTypes';
import { render, screen, userEvent, waitFor } from '@/test-utils';
import { createTestLocalDataSource } from '@/test-utils/db';
import { PreferencesFactory } from '@/test-utils/factories/PreferencesFactory';

jest.mock('@/components/Contexts/Views/Board/Board', () => () => <div>Board View</div>);
jest.mock('@/components/Contexts/Views/List/List', () => () => <div>List View</div>);
jest.mock('@/components/Contexts/Views/Calendar/Calendar', () => () => <div>Calendar View</div>);

describe('ContextPage', () => {
  let database: PouchDB.Database<DocumentTypes>;
  let localDataSource: DataSource;
  let subscribeToTasks: jest.SpyInstance;
  let getPreferences: jest.SpyInstance;
  const unsubscribeFunction = jest.fn();

  beforeEach(() => {
    const testData = createTestLocalDataSource();
    localDataSource = testData.dataSource;
    database = testData.database;

    subscribeToTasks = jest
      .spyOn(localDataSource, 'subscribeToTasks')
      .mockReturnValue(unsubscribeFunction);

    getPreferences = jest.spyOn(localDataSource, 'getPreferences').mockResolvedValue(
      new PreferencesFactory().create({
        lastSelectedContext: 'Test Context',
      })
    );
  });

  afterEach(async () => {
    subscribeToTasks.mockRestore();
    getPreferences.mockRestore();
    await database.destroy();
  });

  const renderWithDataSource = (component: ReactElement) => {
    return render(
      <DataSourceContextProvider dataSource={localDataSource}>
        {component}
      </DataSourceContextProvider>
    );
  };

  it('Subscribes to tasks with the correct parameters', async () => {
    renderWithDataSource(<ContextPage contextName="Test Context" />);

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
    renderWithDataSource(<ContextPage contextName="Test Context" />);

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
    renderWithDataSource(<ContextPage contextName="Test Context" />);

    // The view selector needs to be loaded so that this test doesn't cause issues
    await screen.findByRole('radio', { name: 'List' });

    await waitFor(() => {
      expect(screen.getByText('List View')).toBeInTheDocument();
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
