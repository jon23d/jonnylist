import { ReactElement } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import List from '@/components/Contexts/Views/List/List';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { DataSource } from '@/data/DataSource';
import { DocumentTypes } from '@/data/documentTypes';
import { TaskStatus } from '@/data/documentTypes/Task';
import { render, screen, waitFor, within } from '@/test-utils';
import { createTestLocalDataSource } from '@/test-utils/db';
import { TaskFactory } from '@/test-utils/factories/TaskFactory';

const mockDataSource = {
  updateTask: jest.fn(),
};
jest.mock('@/contexts/DataSourceContext', () => ({
  ...jest.requireActual('@/contexts/DataSourceContext'),
  useDataSource: () => mockDataSource,
}));

let onDragEndSpy: (result: DropResult) => void;

// Testing the drag and drop functionality is not easy. We cannot directly test the drag and drop
// behavior in jsdom, so instead we will intercept the onDragEnd function and pass in the resulting
// DropResult object to simulate a drag and drop operation. This allows us to test the logic that
// handles the re-ordering of tasks and updating their statuses without needing to actually drag and drop
// @ts-ignore
jest.mock('@hello-pangea/dnd', () => ({
  ...jest.requireActual('@hello-pangea/dnd'),
  DragDropContext: ({ children, onDragEnd }: any) => {
    onDragEndSpy = onDragEnd;
    return <div data-testid="mock-drag-drop-context">{children}</div>;
  },
  Droppable: ({ children, droppableId }: any) => (
    <div data-testid={`mock-droppable-${droppableId}`}>
      {children({ innerRef: jest.fn(), droppableProps: {}, placeholder: null })}
    </div>
  ),
  Draggable: ({ children, draggableId, _ }: any) => (
    <div data-testid={`mock-draggable-${draggableId}`} draggable="true">
      {children(
        { innerRef: jest.fn(), draggableProps: {}, dragHandleProps: {}, renderClone: jest.fn() },
        { isDragging: false }
      )}
    </div>
  ),
}));

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
    await dataSource.cleanup();
    await db.destroy();
  });

  const renderComponent = (component: ReactElement) => {
    return render(
      <DataSourceContextProvider dataSource={dataSource}>{component}</DataSourceContextProvider>
    );
  };

  it('Only renders tasks with visible statuses', async () => {
    const tasks = [
      taskFactory.create({ _id: '1', status: TaskStatus.Ready, title: 'Task 1' }),
      taskFactory.create({ _id: '2', status: TaskStatus.Started, title: 'Task 2' }),
      taskFactory.create({ _id: '3', status: TaskStatus.Done, title: 'Task 3' }),
    ];
    await Promise.all(tasks.map((task) => dataSource.addTask(task)));

    renderComponent(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Started]} />
    );

    expect(screen.queryByText('ready (1)')).toBeInTheDocument();
    expect(screen.queryByText('started (1)')).toBeInTheDocument();
    expect(screen.queryByText('done (1)')).not.toBeInTheDocument();
  });

  it('Groups the tasks by status and renders them in separate sections', async () => {
    const tasks = [
      taskFactory.create({ _id: '1', status: TaskStatus.Ready, title: 'Task 1' }),
      taskFactory.create({ _id: '2', status: TaskStatus.Ready, title: 'Task 2' }),
      taskFactory.create({ _id: '3', status: TaskStatus.Started, title: 'Task 3' }),
    ];
    await Promise.all(tasks.map((task) => dataSource.addTask(task)));

    renderComponent(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Started]} />
    );

    const readySection = screen.getByTestId(`mock-droppable-${TaskStatus.Ready}`);
    const startedSection = screen.getByTestId(`mock-droppable-${TaskStatus.Started}`);

    expect(screen.getByText('ready (2)')).toBeInTheDocument();
    expect(screen.getByText('started (1)')).toBeInTheDocument();
    expect(within(readySection).getByText('Task 1')).toBeInTheDocument();
    expect(within(startedSection).getByText('Task 3')).toBeInTheDocument();
  });

  it('updates task status and re-groups tasks when dragged to a different status', async () => {
    const tasks = [
      taskFactory.create({ _id: '1', status: TaskStatus.Ready }),
      taskFactory.create({ _id: '2', status: TaskStatus.Ready, title: 'Task A' }),
      taskFactory.create({ _id: '3', status: TaskStatus.Started, title: 'Task B' }),
    ];

    await Promise.all(tasks.map((task) => dataSource.addTask(task)));

    renderComponent(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Started]} />
    );

    expect(screen.getByText(`${TaskStatus.Ready} (2)`)).toBeInTheDocument();
    expect(screen.getByText(`${TaskStatus.Started} (1)`)).toBeInTheDocument();

    // These were grabbed from the rendered component in the browser
    const mockDropResult: DropResult = {
      draggableId: 'task-2',
      type: 'DEFAULT',
      source: {
        droppableId: TaskStatus.Ready,
        index: 0,
      },
      destination: {
        droppableId: TaskStatus.Started,
        index: 0,
      },
      mode: 'FLUID',
      combine: null,
      reason: 'DROP',
    };

    await waitFor(async () => {
      onDragEndSpy(mockDropResult);
    });

    expect(mockDataSource.updateTask).toHaveBeenCalledWith({
      ...tasks[1],
      status: TaskStatus.Started,
    });
  });

  // In these tests, a means the sort order of the task after the drop index,
  // and b means the sort order of the task before
  it('Sets sort order to the first position to a - 1000', async () => {
    const tasks = [
      taskFactory.create({ _id: '1', status: TaskStatus.Ready, title: 'Task 1', sortOrder: 1000 }),
      taskFactory.create({ _id: '2', status: TaskStatus.Ready, title: 'Task 2', sortOrder: 2000 }),
    ];
    await Promise.all(tasks.map((task) => dataSource.addTask(task)));

    renderComponent(<List tasks={tasks} visibleStatuses={[TaskStatus.Ready]} />);

    const mockDropResult: DropResult = {
      draggableId: 'task-2',
      type: 'DEFAULT',
      source: {
        // Drag from the second position to the first position
        droppableId: TaskStatus.Ready,
        index: 1,
      },
      destination: {
        droppableId: TaskStatus.Ready,
        index: 0,
      },
      mode: 'FLUID',
      combine: null,
      reason: 'DROP',
    };

    await waitFor(async () => {
      onDragEndSpy(mockDropResult);
    });

    expect(mockDataSource.updateTask).toHaveBeenCalledWith({
      ...tasks[1],
      sortOrder: 0,
    });
  });

  it('Sets sort order to the last position to b + 1000', async () => {
    const tasks = [
      taskFactory.create({ _id: '1', status: TaskStatus.Ready, title: 'Task 1', sortOrder: 1000 }),
      taskFactory.create({ _id: '2', status: TaskStatus.Ready, title: 'Task 2', sortOrder: 2000 }),
    ];
    await Promise.all(tasks.map((task) => dataSource.addTask(task)));

    renderComponent(<List tasks={tasks} visibleStatuses={[TaskStatus.Ready]} />);

    const mockDropResult: DropResult = {
      draggableId: 'task-1',
      type: 'DEFAULT',
      source: {
        // Drag from the first position to the last position
        droppableId: TaskStatus.Ready,
        index: 0,
      },
      destination: {
        droppableId: TaskStatus.Ready,
        index: 1,
      },
      mode: 'FLUID',
      combine: null,
      reason: 'DROP',
    };

    await waitFor(async () => {
      onDragEndSpy(mockDropResult);
    });

    expect(mockDataSource.updateTask).toHaveBeenCalledWith({
      ...tasks[0],
      sortOrder: 3000,
    });
  });

  it('Sets sort order to the middle position to an average of a, b', async () => {
    const tasks = [
      taskFactory.create({ _id: '1', status: TaskStatus.Ready, title: 'Task 1', sortOrder: 1000 }),
      taskFactory.create({ _id: '2', status: TaskStatus.Ready, title: 'Task 2', sortOrder: 3000 }),
      taskFactory.create({ _id: '3', status: TaskStatus.Ready, title: 'Task 3', sortOrder: 5000 }),
    ];
    await Promise.all(tasks.map((task) => dataSource.addTask(task)));

    renderComponent(<List tasks={tasks} visibleStatuses={[TaskStatus.Ready]} />);

    const mockDropResult: DropResult = {
      draggableId: 'task-1',
      type: 'DEFAULT',
      source: {
        // Drag from the first position to the middle position
        droppableId: TaskStatus.Ready,
        index: 0,
      },
      destination: {
        droppableId: TaskStatus.Ready,
        index: 1,
      },
      mode: 'FLUID',
      combine: null,
      reason: 'DROP',
    };

    await waitFor(async () => {
      onDragEndSpy(mockDropResult);
    });

    expect(mockDataSource.updateTask).toHaveBeenCalledWith({
      ...tasks[0],
      sortOrder: 4000,
    });
  });

  it('Sets the sort order when alone to 5000', async () => {
    const task = taskFactory.create({ _id: '1', status: TaskStatus.Ready, title: 'Task 1' });
    await dataSource.addTask(task);

    renderComponent(
      <List tasks={[task]} visibleStatuses={[TaskStatus.Ready, TaskStatus.Started]} />
    );

    const mockDropResult: DropResult = {
      draggableId: 'task-1',
      type: 'DEFAULT',
      source: {
        droppableId: TaskStatus.Ready,
        index: 0,
      },
      destination: {
        droppableId: TaskStatus.Started,
        index: 0,
      },
      mode: 'FLUID',
      combine: null,
      reason: 'DROP',
    };

    await waitFor(async () => {
      onDragEndSpy(mockDropResult);
    });

    expect(mockDataSource.updateTask).toHaveBeenCalledWith({
      ...task,
      status: TaskStatus.Started,
      sortOrder: 5000,
    });
  });

  it('Sets sort order in a new status in first position to a - 1000', async () => {
    const tasks = [
      taskFactory.create({ _id: '1', status: TaskStatus.Ready, sortOrder: 1000 }),
      taskFactory.create({ _id: '2', status: TaskStatus.Ready, sortOrder: 2000 }),
      taskFactory.create({ _id: '2', status: TaskStatus.Waiting, sortOrder: 2000 }),
    ];
    await Promise.all(tasks.map((task) => dataSource.addTask(task)));

    renderComponent(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Waiting]} />
    );

    const mockDropResult: DropResult = {
      draggableId: 'task-1',
      type: 'DEFAULT',
      source: {
        // Drag from the first position to first position in other status
        droppableId: TaskStatus.Ready,
        index: 0,
      },
      destination: {
        droppableId: TaskStatus.Waiting,
        index: 0,
      },
      mode: 'FLUID',
      combine: null,
      reason: 'DROP',
    };

    await waitFor(async () => {
      onDragEndSpy(mockDropResult);
    });

    expect(mockDataSource.updateTask).toHaveBeenCalledWith({
      ...tasks[0],
      status: TaskStatus.Waiting,
      sortOrder: 1000,
    });
  });

  it('Sets sort order in a new status in last position to b + 1000', async () => {
    const tasks = [
      taskFactory.create({ _id: '1', status: TaskStatus.Ready, sortOrder: 1000 }),
      taskFactory.create({ _id: '2', status: TaskStatus.Ready, sortOrder: 2000 }),
      taskFactory.create({ _id: '3', status: TaskStatus.Waiting, sortOrder: 2000 }),
    ];
    await Promise.all(tasks.map((task) => dataSource.addTask(task)));

    renderComponent(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Waiting]} />
    );

    const mockDropResult: DropResult = {
      draggableId: 'task-2',
      type: 'DEFAULT',
      source: {
        // Drag from the second position to the end of the other status
        droppableId: TaskStatus.Ready,
        index: 1,
      },
      destination: {
        droppableId: TaskStatus.Waiting,
        index: 1,
      },
      mode: 'FLUID',
      combine: null,
      reason: 'DROP',
    };

    await waitFor(async () => {
      onDragEndSpy(mockDropResult);
    });

    expect(mockDataSource.updateTask).toHaveBeenCalledWith({
      ...tasks[1],
      status: TaskStatus.Waiting,
      sortOrder: 3000,
    });
  });

  it('Sets sort order in a new status in middle position to an average of a, b', async () => {
    const tasks = [
      taskFactory.create({ _id: '1', status: TaskStatus.Ready, sortOrder: 1000 }),
      taskFactory.create({ _id: '2', status: TaskStatus.Ready, sortOrder: 3000 }),
      taskFactory.create({ _id: '3', status: TaskStatus.Waiting, sortOrder: 5000 }),
      taskFactory.create({ _id: '4', status: TaskStatus.Waiting, sortOrder: 7000 }),
    ];
    await Promise.all(tasks.map((task) => dataSource.addTask(task)));

    renderComponent(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Waiting]} />
    );

    const mockDropResult: DropResult = {
      draggableId: 'task-1',
      type: 'DEFAULT',
      source: {
        // Drag from the first position to the middle position in the other status
        droppableId: TaskStatus.Ready,
        index: 0,
      },
      destination: {
        droppableId: TaskStatus.Waiting,
        index: 1,
      },
      mode: 'FLUID',
      combine: null,
      reason: 'DROP',
    };

    await waitFor(async () => {
      onDragEndSpy(mockDropResult);
    });

    expect(mockDataSource.updateTask).toHaveBeenCalledWith({
      ...tasks[0],
      status: TaskStatus.Waiting,
      sortOrder: 6000,
    });
  });
});
