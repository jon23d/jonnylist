import { waitFor } from '@testing-library/react';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { DataSource } from '@/data/DataSource';
import { DocumentTypes } from '@/data/documentTypes';
import { render, screen, userEvent } from '@/test-utils';
import { createTestLocalDataSource } from '@/test-utils/db';
import NewTaskForm from '../NewTaskForm';

const mockDataSource = {
  getContexts: jest.fn().mockResolvedValue(['Context1', 'Context2']),
  getPreferences: jest.fn().mockResolvedValue({ lastSelectedContext: 'Context1' }),
  addTask: jest.fn(),
};
jest.mock('@/contexts/DataSourceContext', () => ({
  ...jest.requireActual('@/contexts/DataSourceContext'),
  useDataSource: () => mockDataSource,
}));

jest.mock('@/data/documentTypes/Task', () => ({
  ...jest.requireActual('@/data/documentTypes/Task'),
  taskStatusSelectOptions: [
    { value: 'ready', label: 'Ready' },
    { value: 'done', label: 'Done' },
  ],
}));

describe('NewTaskForm', () => {
  let dataSource: DataSource;
  let db: PouchDB.Database<DocumentTypes>;

  beforeEach(() => {
    jest.clearAllMocks();

    const testData = createTestLocalDataSource();
    dataSource = testData.dataSource;
    db = testData.database;
  });

  afterEach(async () => {
    await dataSource.cleanup();
    await db.destroy();
  });

  it('Gets all and the last selected context from the data source', async () => {
    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <NewTaskForm handleClose={() => {}} />
      </DataSourceContextProvider>
    );

    expect(mockDataSource.getContexts).toHaveBeenCalled();
    expect(mockDataSource.getPreferences).toHaveBeenCalled();
  });

  it('Renders the context select with available contexts', async () => {
    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <NewTaskForm handleClose={() => {}} />
      </DataSourceContextProvider>
    );

    const contextSelect = screen.getByRole('textbox', { name: 'Context' });
    expect(contextSelect).toBeInTheDocument();

    await userEvent.click(contextSelect);

    expect(screen.getByText('Context1')).toBeInTheDocument();
    expect(screen.getByText('Context2')).toBeInTheDocument();
  });

  it('Renders the status select with task status options', async () => {
    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <NewTaskForm handleClose={() => {}} />
      </DataSourceContextProvider>
    );

    const statusSelect = screen.getByRole('textbox', { name: 'Status' });
    await userEvent.click(statusSelect);

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('Saves a new task when the form is submitted', async () => {
    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <NewTaskForm handleClose={() => {}} />
      </DataSourceContextProvider>
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

    expect(mockDataSource.addTask).toHaveBeenCalledWith(
      expect.objectContaining({
        context: 'Context2',
        title: 'Test Task',
        description: 'This is a test task description.',
        priority: 5,
        dueDate: '2026-01-15',
        status: 'done',
      })
    );
  });

  it('Uses the last selected context as the default value', async () => {
    mockDataSource.getPreferences.mockResolvedValueOnce({ lastSelectedContext: 'Context1' });

    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <NewTaskForm handleClose={() => {}} />
      </DataSourceContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Context' })).toHaveDisplayValue('Context1');
    });
  });
});
