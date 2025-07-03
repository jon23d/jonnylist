import { DropResult } from '@hello-pangea/dnd';
import List from '@/components/Contexts/Views/List/List';
import { TaskStatus } from '@/data/documentTypes/Task';
import { generateKeyBetween, generateNKeysBetween } from '@/helpers/fractionalIndexing';
import { renderWithDataSource, screen, waitFor, within } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import { taskFactory } from '@/test-utils/factories/TaskFactory';

const mockTaskRepository = {
  updateTask: jest.fn(),
};
jest.mock('@/contexts/DataSourceContext', () => ({
  ...jest.requireActual('@/contexts/DataSourceContext'),
  useTaskRepository: () => mockTaskRepository,
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
  const { getDataSource } = setupTestDatabase();

  it('Only renders tasks with visible statuses', async () => {
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    const tasks = [
      taskFactory({ _id: '1', status: TaskStatus.Ready, title: 'Task 1' }),
      taskFactory({ _id: '2', status: TaskStatus.Started, title: 'Task 2' }),
      taskFactory({ _id: '3', status: TaskStatus.Done, title: 'Task 3' }),
    ];
    await Promise.all(tasks.map((task) => taskRepository.addTask(task)));

    renderWithDataSource(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Started]} />,
      dataSource
    );

    expect(screen.queryByText('ready (1)')).toBeInTheDocument();
    expect(screen.queryByText('started (1)')).toBeInTheDocument();
    expect(screen.queryByText('done (1)')).not.toBeInTheDocument();
  });

  it('Groups the tasks by status and renders them in separate sections', async () => {
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    const tasks = [
      taskFactory({ _id: '1', status: TaskStatus.Ready, title: 'Task 1' }),
      taskFactory({ _id: '2', status: TaskStatus.Ready, title: 'Task 2' }),
      taskFactory({ _id: '3', status: TaskStatus.Started, title: 'Task 3' }),
    ];
    await Promise.all(tasks.map((task) => taskRepository.addTask(task)));

    renderWithDataSource(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Started]} />,
      dataSource
    );

    const readySection = screen.getByTestId(`mock-droppable-${TaskStatus.Ready}`);
    const startedSection = screen.getByTestId(`mock-droppable-${TaskStatus.Started}`);

    expect(screen.getByText('ready (2)')).toBeInTheDocument();
    expect(screen.getByText('started (1)')).toBeInTheDocument();
    expect(within(readySection).getByText(/Task 1/)).toBeInTheDocument();
    expect(within(startedSection).getByText(/Task 3/)).toBeInTheDocument();
  });

  it('updates task status and re-groups tasks when dragged to a different status', async () => {
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    const sorts = generateNKeysBetween(null, null, 3);

    const tasks = [
      taskFactory({ _id: '1', status: TaskStatus.Ready, sortOrder: sorts[0] }),
      taskFactory({
        _id: '2',
        status: TaskStatus.Ready,
        title: 'Task A',
        sortOrder: sorts[1],
      }),
      taskFactory({
        _id: '3',
        status: TaskStatus.Started,
        title: 'Task B',
        sortOrder: sorts[2],
      }),
    ];

    await Promise.all(tasks.map((task) => taskRepository.addTask(task)));

    renderWithDataSource(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Started]} />,
      dataSource
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

    await waitFor(() => {
      onDragEndSpy(mockDropResult);
    });

    expect(mockTaskRepository.updateTask).toHaveBeenCalledWith({
      ...tasks[1],
      status: TaskStatus.Started,
    });
  });

  it('Sets sort order for the first position', async () => {
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    const sorts = generateNKeysBetween(null, null, 2);
    const tasks = [
      taskFactory({
        _id: '1',
        status: TaskStatus.Ready,
        sortOrder: sorts[0],
      }),
      taskFactory({
        _id: '2',
        status: TaskStatus.Ready,
        sortOrder: sorts[1],
      }),
    ];
    await Promise.all(tasks.map((task) => taskRepository.addTask(task)));

    renderWithDataSource(<List tasks={tasks} visibleStatuses={[TaskStatus.Ready]} />, dataSource);

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

    await waitFor(() => {
      onDragEndSpy(mockDropResult);
    });

    const expectedSortOrder = generateKeyBetween(null, sorts[0]);

    expect(mockTaskRepository.updateTask).toHaveBeenCalledWith({
      ...tasks[1],
      sortOrder: expectedSortOrder,
    });
  });

  it('Sets sort order to the last position', async () => {
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    const sorts = generateNKeysBetween(null, null, 2);
    const tasks = [
      taskFactory({
        _id: '1',
        status: TaskStatus.Ready,
        title: 'Task 1',
        sortOrder: sorts[0],
      }),
      taskFactory({
        _id: '2',
        status: TaskStatus.Ready,
        title: 'Task 2',
        sortOrder: sorts[1],
      }),
    ];
    await Promise.all(tasks.map((task) => taskRepository.addTask(task)));

    renderWithDataSource(<List tasks={tasks} visibleStatuses={[TaskStatus.Ready]} />, dataSource);

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

    await waitFor(() => {
      onDragEndSpy(mockDropResult);
    });

    const expectedSortOrder = generateKeyBetween(sorts[1], null);

    expect(mockTaskRepository.updateTask).toHaveBeenCalledWith({
      ...tasks[0],
      sortOrder: expectedSortOrder,
    });
  });

  it('Sets sort order to the middle position', async () => {
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    const sorts = generateNKeysBetween(null, null, 3);
    const tasks = [
      taskFactory({
        _id: '1',
        status: TaskStatus.Ready,
        title: 'Task 1',
        sortOrder: sorts[0],
      }),
      taskFactory({
        _id: '2',
        status: TaskStatus.Ready,
        title: 'Task 2',
        sortOrder: sorts[1],
      }),
      taskFactory({
        _id: '3',
        status: TaskStatus.Ready,
        title: 'Task 3',
        sortOrder: sorts[2],
      }),
    ];
    await Promise.all(tasks.map((task) => taskRepository.addTask(task)));

    const expectedSortOrder = generateKeyBetween(sorts[1], sorts[2]);

    renderWithDataSource(<List tasks={tasks} visibleStatuses={[TaskStatus.Ready]} />, dataSource);

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

    await waitFor(() => {
      onDragEndSpy(mockDropResult);
    });

    expect(mockTaskRepository.updateTask).toHaveBeenCalledWith({
      ...tasks[0],
      sortOrder: expectedSortOrder,
    });
  });
  it('Sets sort order in a new status in first position', async () => {
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    const sorts = generateNKeysBetween(null, null, 3);
    const tasks = [
      taskFactory({ _id: '1', status: TaskStatus.Ready, sortOrder: sorts[0] }),
      taskFactory({ _id: '2', status: TaskStatus.Ready, sortOrder: sorts[1] }),
      taskFactory({ _id: '3', status: TaskStatus.Waiting, sortOrder: sorts[2] }),
    ];
    await Promise.all(tasks.map((task) => taskRepository.addTask(task)));

    renderWithDataSource(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Waiting]} />,
      dataSource
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

    await waitFor(() => {
      onDragEndSpy(mockDropResult);
    });

    const expectedSortOrder = generateKeyBetween(null, sorts[2]);

    expect(mockTaskRepository.updateTask).toHaveBeenCalledWith({
      ...tasks[0],
      status: TaskStatus.Waiting,
      sortOrder: expectedSortOrder,
    });
  });

  it('Sets sort order in a new status in last position', async () => {
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    const sorts = generateNKeysBetween(null, null, 3);
    const tasks = [
      taskFactory({ _id: '1', status: TaskStatus.Ready, sortOrder: sorts[0] }),
      taskFactory({ _id: '2', status: TaskStatus.Ready, sortOrder: sorts[1] }),
      taskFactory({ _id: '3', status: TaskStatus.Waiting, sortOrder: sorts[2] }),
    ];
    await Promise.all(tasks.map((task) => taskRepository.addTask(task)));

    renderWithDataSource(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Waiting]} />,
      dataSource
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

    await waitFor(() => {
      onDragEndSpy(mockDropResult);
    });

    const expectedSortOrder = generateKeyBetween(sorts[2], null);

    expect(mockTaskRepository.updateTask).toHaveBeenCalledWith({
      ...tasks[1],
      status: TaskStatus.Waiting,
      sortOrder: expectedSortOrder,
    });
  });

  it('Sets sort order in a new status in middle position', async () => {
    const dataSource = getDataSource();
    const taskRepository = dataSource.getTaskRepository();

    const sorts = generateNKeysBetween(null, null, 4);
    const tasks = [
      taskFactory({ _id: '1', status: TaskStatus.Ready, sortOrder: sorts[0] }),
      taskFactory({ _id: '2', status: TaskStatus.Ready, sortOrder: sorts[1] }),
      taskFactory({ _id: '3', status: TaskStatus.Waiting, sortOrder: sorts[2] }),
      taskFactory({ _id: '4', status: TaskStatus.Waiting, sortOrder: sorts[3] }),
    ];
    await Promise.all(tasks.map((task) => taskRepository.addTask(task)));

    renderWithDataSource(
      <List tasks={tasks} visibleStatuses={[TaskStatus.Ready, TaskStatus.Waiting]} />,
      dataSource
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

    await waitFor(() => {
      onDragEndSpy(mockDropResult);
    });

    const expectedSortOrder = generateKeyBetween(sorts[2], sorts[3]);

    expect(mockTaskRepository.updateTask).toHaveBeenCalledWith({
      ...tasks[0],
      status: TaskStatus.Waiting,
      sortOrder: expectedSortOrder,
    });
  });
});
