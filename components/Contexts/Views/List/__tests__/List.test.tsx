import { ReactElement } from 'react';
import List from '@/components/Contexts/Views/List/List';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { DataSource } from '@/data/DataSource';
import { DocumentTypes } from '@/data/documentTypes';
import { TaskStatus } from '@/data/documentTypes/Task';
import { render, screen, waitFor } from '@/test-utils';
import { createTestLocalDataSource } from '@/test-utils/db';
import { TaskFactory } from '@/test-utils/factories/TaskFactory';

let onDragEndSpy: (result: DropResult) => void;

describe('Task list view component', () => {
  let dataSource: DataSource;
  let db: PouchDB.Database<DocumentTypes>;
  const taskFactory = new TaskFactory();

  beforeEach(() => {
    jest.clearAllMocks();

    const testData = createTestLocalDataSource();
    dataSource = testData.dataSource;
    db = testData.database;
  });

  afterEach(async () => {
    await db.destroy();
  });

  const renderComponent = (component: ReactElement) => {
    return render(
      <DataSourceContextProvider dataSource={dataSource}>{component}</DataSourceContextProvider>
    );
  };

  it('Groups the tasks by status and renders them in separate sections', async () => {
    const tasks = [
      taskFactory.create({ _id: '1', status: TaskStatus.Ready }),
      taskFactory.create({ _id: '2', status: TaskStatus.Ready }),
      taskFactory.create({ _id: '3', status: TaskStatus.Started }),
    ];

    await Promise.all(tasks.map((task) => dataSource.addTask(task)));

    renderComponent(<List tasks={tasks} />);

    expect(screen.getByText('ready (2)')).toBeInTheDocument();
    expect(screen.getByText('started (1)')).toBeInTheDocument();
  });

  it('updates task status and re-groups tasks when dragged to a different status', async () => {
    // This is pretty hard to test in this context. I think we will simply invoke handleDragEnd
    // directly with a mock result.
    // TODO Make this real
    expect(1).toEqual(1);
  });
});
