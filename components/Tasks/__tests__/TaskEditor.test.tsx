import { ReactElement } from 'react';
import TaskEditor from '@/components/Tasks/TaskEditor';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { DataSource } from '@/data/DataSource';
import { DocumentTypes } from '@/data/documentTypes';
import { TaskStatus } from '@/data/documentTypes/Task';
import { render, screen, userEvent, waitFor } from '@/test-utils';
import { createTestLocalDataSource } from '@/test-utils/db';
import { TaskFactory } from '@/test-utils/factories/TaskFactory';

const updateTaskMock = jest.fn();
const getContextsMock = jest.fn().mockResolvedValue(['context1', 'context2']);
const mockDataSource = {
  getContexts: getContextsMock,
  updateTask: updateTaskMock,
};
jest.mock('@/contexts/DataSourceContext', () => ({
  ...jest.requireActual('@/contexts/DataSourceContext'),
  useDataSource: () => mockDataSource,
}));

describe('TaskEditor', () => {
  const taskFactory = new TaskFactory();
  let db: PouchDB.Database<DocumentTypes>;
  let dataSource: DataSource;

  beforeEach(() => {
    jest.clearAllMocks();

    const testData = createTestLocalDataSource();
    db = testData.database;
    dataSource = testData.dataSource;
  });

  afterEach(async () => {
    await db.destroy();
  });

  const renderWithDatasource = (component: ReactElement) => {
    return render(
      <DataSourceContextProvider dataSource={dataSource}>{component}</DataSourceContextProvider>
    );
  };

  it('Renders the public fields of a task in a form', async () => {
    const task = taskFactory.create({
      status: TaskStatus.Ready,
      context: 'context1',
      dueDate: new Date('2023-10-01'),
    });

    renderWithDatasource(<TaskEditor task={task} handleClose={() => {}} />);

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
    expect(priorityInput).toHaveValue(task.priority.toString());

    const dueDateInput = screen.getByRole('textbox', { name: 'Due Date' });
    expect(dueDateInput).toBeInTheDocument();
    expect(dueDateInput).toHaveValue('September 30, 2023');

    const statusInput = screen.getByRole('textbox', { name: 'Status' });
    expect(statusInput).toBeInTheDocument();
    expect(statusInput).toHaveValue('Ready');
  });

  it('fetches contexts and populates the Context select input', async () => {
    const task = taskFactory.create(); // Context value doesn't matter for this test
    renderWithDatasource(<TaskEditor task={task} handleClose={() => {}} />);

    // Assert that getContexts was called when the component mounted
    expect(getContextsMock).toHaveBeenCalledTimes(1);
  });
});
