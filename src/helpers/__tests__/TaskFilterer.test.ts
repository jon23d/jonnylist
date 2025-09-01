import { TaskFilter, TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { TaskFilterer } from '../TaskFilterer';

describe('TaskFilterer', () => {
  let filter: TaskFilter;

  beforeEach(() => {
    filter = {
      statuses: [],
      due: undefined,
      requireTags: [],
      excludeTags: [],
      requireProjects: [],
      excludeProjects: undefined,
      requirePriority: [],
      excludePriority: [],
      hasNoTags: undefined,
      hasNoProject: undefined,
      dueWithin: undefined,
    };
  });

  it('should filter tasks by status', () => {
    const tasks = [
      taskFactory({ status: TaskStatus.Cancelled }),
      taskFactory({ status: TaskStatus.Done }),
      taskFactory({ status: TaskStatus.Ready }),
    ];
    filter.statuses = [TaskStatus.Cancelled, TaskStatus.Done];

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: TaskStatus.Cancelled }),
        expect.objectContaining({ status: TaskStatus.Done }),
      ])
    );
  });

  it('Should filter by is due', () => {
    const tasks = [
      taskFactory({ dueDate: '2023-10-01' }),
      taskFactory({ dueDate: '2023-10-15' }),
      taskFactory({ dueDate: '2023-11-01' }),
      taskFactory({ dueDate: undefined }),
    ];
    filter.due = true;

    const taskFilterer = new TaskFilterer(filter, new Date('2023-10-15'));

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dueDate: '2023-10-01' }),
        expect.objectContaining({ dueDate: '2023-10-15' }),
      ])
    );
  });

  it('Should filter by both required and excluded tags', () => {
    const tasks = [
      taskFactory({ tags: ['work', 'urgent'] }),
      taskFactory({ tags: ['work', 'foo'] }),
      taskFactory({ tags: ['personal'] }),
      taskFactory({ tags: ['work'] }),
      taskFactory({ tags: [] }),
    ];
    filter.requireTags = ['Work']; // this is upper case to test case insensitivity
    filter.excludeTags = ['Urgent'];

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tags: ['work', 'foo'] }),
        expect.objectContaining({ tags: ['work'] }),
      ])
    );
  });

  it('Should filter by just required tags', () => {
    const tasks = [
      taskFactory({ tags: ['work', 'urgent'] }),
      taskFactory({ tags: ['work', 'foo'] }),
      taskFactory({ tags: ['personal'] }),
      taskFactory({ tags: ['work'] }),
      taskFactory({ tags: [] }),
    ];
    filter.requireTags = ['Work']; // this is upper case to test case insensitivity

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(3);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tags: ['work', 'urgent'] }),
        expect.objectContaining({ tags: ['work', 'foo'] }),
        expect.objectContaining({ tags: ['work'] }),
      ])
    );
  });

  it('Should filter by just excluded tags', () => {
    const tasks = [
      taskFactory({ tags: ['work', 'urgent'] }),
      taskFactory({ tags: ['work', 'foo'] }),
      taskFactory({ tags: ['personal'] }),
      taskFactory({ tags: ['work'] }),
      taskFactory({ tags: [] }),
    ];
    filter.excludeTags = ['Urgent']; // this is upper case to test case insensitivity

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(4);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tags: ['work', 'foo'] }),
        expect.objectContaining({ tags: ['personal'] }),
        expect.objectContaining({ tags: ['work'] }),
        expect.objectContaining({ tags: [] }),
      ])
    );
  });

  it('Should filter by required and excluded projects', () => {
    const tasks = [
      taskFactory({ project: 'Project A' }),
      taskFactory({ project: 'Project B' }),
      taskFactory({ project: 'Project C' }),
      { ...taskFactory(), project: undefined },
    ];
    filter.requireProjects = ['project A', 'project B']; // lower case to test case insensitivity
    filter.excludeProjects = ['project C'];

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ project: 'Project A' }),
        expect.objectContaining({ project: 'Project B' }),
      ])
    );
  });

  it('Should filter by just required projects', () => {
    const tasks = [
      taskFactory({ project: 'Project A' }),
      taskFactory({ project: 'Project B' }),
      taskFactory({ project: 'Project C' }),
      { ...taskFactory(), project: undefined },
    ];
    filter.requireProjects = ['project A']; // lower case to test case insensitivity

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(1);
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ project: 'Project A' })])
    );
  });

  it('Should filter by just excluded projects', () => {
    const tasks = [
      taskFactory({ project: 'Project A' }),
      taskFactory({ project: 'Project B' }),
      taskFactory({ project: 'Project C' }),
      { ...taskFactory(), project: undefined },
    ];
    filter.excludeProjects = ['project C']; // lower case to test case insensitivity

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(3);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ project: 'Project A' }),
        expect.objectContaining({ project: 'Project B' }),
        expect.objectContaining({ project: undefined }),
      ])
    );
  });

  it('Should filter by hasNoProject', () => {
    const tasks = [taskFactory({ project: 'Project A' }), { ...taskFactory(), project: undefined }];
    filter.hasNoProject = true;

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(1);
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ project: undefined })])
    );
  });

  it('Should filter by both required and excluded priorities', () => {
    const tasks = [
      taskFactory({ priority: TaskPriority.High }),
      taskFactory({ priority: TaskPriority.Medium }),
      taskFactory({ priority: TaskPriority.Low }),
      { ...taskFactory(), priority: undefined },
    ];
    filter.requirePriority = [TaskPriority.High, TaskPriority.Medium];
    filter.excludePriority = [TaskPriority.Low];

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ priority: TaskPriority.High }),
        expect.objectContaining({ priority: TaskPriority.Medium }),
      ])
    );
  });

  it('Should filter by just excluded priorities', () => {
    const tasks = [
      taskFactory({ priority: TaskPriority.High }),
      taskFactory({ priority: TaskPriority.Medium }),
      taskFactory({ priority: TaskPriority.Low }),
      { ...taskFactory(), priority: undefined },
    ];
    filter.excludePriority = [TaskPriority.Low];

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(3);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ priority: TaskPriority.High }),
        expect.objectContaining({ priority: TaskPriority.Medium }),
        expect.objectContaining({ priority: undefined }),
      ])
    );
  });

  it('Should filter by due date minimum number of days from now only', () => {
    const now = new Date('2023-12-31');

    const tasks = [
      taskFactory({ dueDate: '2024-01-01' }), // Due in 1 day
      taskFactory({ dueDate: '2024-01-05' }), // Due in 5 days
      taskFactory({ dueDate: '2023-12-15' }), // Overdue
      taskFactory({ dueDate: undefined }), // No due date
    ];
    filter.dueWithin = { minimumNumberOfDaysFromToday: 3 };

    const taskFilterer = new TaskFilterer(filter, now);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(1);
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ dueDate: '2024-01-05' })])
    );
  });

  it('Should filter by due date maximum number of days from now only', () => {
    const now = new Date('2023-12-31');

    const tasks = [
      taskFactory({ dueDate: '2024-01-01' }), // Due in 1 day
      taskFactory({ dueDate: '2024-01-05' }), // Due in 5 days
      taskFactory({ dueDate: '2024-01-10' }), // Due in 10 days
      taskFactory({ dueDate: undefined }), // No due date
    ];
    filter.dueWithin = { maximumNumberOfDaysFromToday: 3 };

    const taskFilterer = new TaskFilterer(filter, now);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(1);
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ dueDate: '2024-01-01' })])
    );
  });

  it('Should filter by both due date minimum and maximum number of days from now', () => {
    const now = new Date('2023-12-31');

    const tasks = [
      taskFactory({ dueDate: '2024-01-01' }), // Due in 1 day
      taskFactory({ dueDate: '2024-01-05' }), // Due in 5 days
      taskFactory({ dueDate: '2024-01-10' }), // Due in 10 days
      taskFactory({ dueDate: '2023-12-15' }), // Overdue
      taskFactory({ dueDate: undefined }), // No due date
    ];
    filter.dueWithin = {
      minimumNumberOfDaysFromToday: 1,
      maximumNumberOfDaysFromToday: 5,
    };

    const taskFilterer = new TaskFilterer(filter, now);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dueDate: '2024-01-01' }),
        expect.objectContaining({ dueDate: '2024-01-05' }),
      ])
    );
  });

  it('Should filter by due date and exclude overdue tasks by default', () => {
    const now = new Date('2023-12-31');

    const tasks = [
      taskFactory({ dueDate: '2024-01-01' }), // Due in 1 day
      taskFactory({ dueDate: '2024-01-05' }), // Due in 5 days
      taskFactory({ dueDate: '2023-12-15' }), // Overdue
      taskFactory({ dueDate: undefined }), // No due date
    ];
    filter.dueWithin = { minimumNumberOfDaysFromToday: 0, maximumNumberOfDaysFromToday: 10 };

    const taskFilterer = new TaskFilterer(filter, now);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dueDate: '2024-01-01' }),
        expect.objectContaining({ dueDate: '2024-01-05' }),
      ])
    );
  });

  it('Should filter by due date and include overdue tasks when specified', () => {
    const now = new Date('2023-12-31');

    const tasks = [
      taskFactory({ dueDate: '2024-01-01' }), // Due in 1 day
      taskFactory({ dueDate: '2024-01-05' }), // Due in 5 days
      taskFactory({ dueDate: '2023-12-15' }), // Overdue
      taskFactory({ dueDate: undefined }), // No due date
    ];
    filter.dueWithin = {
      minimumNumberOfDaysFromToday: 0,
      maximumNumberOfDaysFromToday: 10,
      includeOverdueTasks: true,
    };

    const taskFilterer = new TaskFilterer(filter, now);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(3);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dueDate: '2024-01-01' }),
        expect.objectContaining({ dueDate: '2024-01-05' }),
        expect.objectContaining({ dueDate: '2023-12-15' }),
      ])
    );
  });

  it('Should not attempt to filter by due date if no dueWithin filter is set', () => {
    const tasks = [
      taskFactory({ dueDate: '2024-01-01' }),
      taskFactory({ dueDate: '2024-01-05' }),
      taskFactory({ dueDate: '2023-12-15' }),
      taskFactory({ dueDate: undefined }),
    ];
    filter.dueWithin = {
      includeOverdueTasks: false,
      minimumNumberOfDaysFromToday: undefined,
      maximumNumberOfDaysFromToday: undefined,
    };

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(4);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dueDate: '2024-01-01' }),
        expect.objectContaining({ dueDate: '2024-01-05' }),
        expect.objectContaining({ dueDate: '2023-12-15' }),
        expect.objectContaining({ dueDate: undefined }),
      ])
    );
  });

  it('Should do a case insensitive search when requiring projects', () => {
    const tasks = [taskFactory({ project: 'PROJECT A' }), taskFactory({ project: 'project a' })];
    filter.requireProjects = ['Project a'];

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(2);
  });

  it('Should do a case insensitive search when excluding projects', () => {
    const tasks = [taskFactory({ project: 'PROJECT A' }), taskFactory({ project: 'project a' })];
    filter.excludeProjects = ['Project a'];

    const taskFilterer = new TaskFilterer(filter);

    const result = taskFilterer.filterTasks(tasks);

    expect(result.length).toBe(0);
  });
});
