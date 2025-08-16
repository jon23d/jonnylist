import { Task, TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { defaultCoefficients, getAgeInDays } from '@/helpers/Tasks';
import { preferencesFactory } from '@/test-utils/factories/PreferencesFactory';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { UrgencyCalculator } from '../UrgencyCalculator';

vi.mock('@/helpers/Tasks', async () => {
  const actual = await import('@/helpers/Tasks');
  return {
    ...actual,
    getAgeInDays: vi.fn(() => 365), // This will always result in the addition of 1.0 * ageCoefficient
  };
});

describe('UrgencyCalculator', () => {
  const coefficients = {
    nextTag: 1,
    nearDueDate: 2,
    highPriority: 4,
    mediumPriority: 8,
    lowPriority: 16,
    startedStatus: 32,
    hasDescription: 64,
    hasTags: 128,
    hasProject: 256,
    ageCoefficient: 512,
  };

  const preferences = preferencesFactory({
    coefficients,
  });

  let calculator: UrgencyCalculator;
  let task: Task;

  beforeEach(() => {
    calculator = new UrgencyCalculator(preferences);
    task = taskFactory();
    vi.mocked(getAgeInDays).mockReturnValue(365);
  });

  // Reset the mock after each test
  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  it('should use provided coefficients', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-08T12:00:00Z'));

    const defaultCalculator = new UrgencyCalculator(preferences);
    const task = taskFactory({
      tags: ['next'],
      dueDate: '2024-08-07',
      priority: TaskPriority.High,
      status: TaskStatus.Started,
      description: 'a test description',
      project: 'Test Project',
    });

    expect(defaultCalculator.getUrgency(task)).toEqual(
      coefficients.nextTag +
        coefficients.nearDueDate +
        coefficients.highPriority +
        coefficients.startedStatus +
        coefficients.hasDescription +
        coefficients.hasTags +
        coefficients.hasProject +
        coefficients.ageCoefficient
    );
  });

  it('should use default coefficients', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-08-08T12:00:00Z'));

    const defaultCalculator = new UrgencyCalculator(
      preferencesFactory({ coefficients: undefined })
    );
    const task = taskFactory({
      tags: ['next'],
      dueDate: '2024-08-07',
      priority: TaskPriority.High,
      status: TaskStatus.Started,
      description: 'a test description',
      project: 'Test Project',
    });

    expect(defaultCalculator.getUrgency(task)).toEqual(
      defaultCoefficients.nextTag +
        defaultCoefficients.nearDueDate +
        defaultCoefficients.highPriority +
        defaultCoefficients.startedStatus +
        defaultCoefficients.hasDescription +
        defaultCoefficients.hasTags +
        defaultCoefficients.hasProject +
        defaultCoefficients.ageCoefficient
    );
  });

  describe('getUrgency', () => {
    it('should calculate urgency based on all task properties', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2023-01-01'));
      task = taskFactory({
        tags: ['next', 'tag1'],
        dueDate: '2022-12-30',
        priority: TaskPriority.Medium,
        status: TaskStatus.Started,
        description: 'A test description',
        project: 'Project Alpha',
      });

      // The expected urgency is the sum of all coefficients plus the age factor.
      const expectedUrgency =
        coefficients.nextTag +
        coefficients.nearDueDate +
        coefficients.mediumPriority +
        coefficients.startedStatus +
        coefficients.hasDescription +
        coefficients.hasTags +
        coefficients.hasProject +
        coefficients.ageCoefficient;

      expect(calculator.getUrgency(task)).toBe(expectedUrgency);
    });

    it('should not add coefficients for properties that are not set', () => {
      task = taskFactory({
        tags: [],
        dueDate: undefined,
        priority: TaskPriority.Low,
        status: TaskStatus.Ready,
        description: '',
        project: '',
      });

      const expectedUrgency = coefficients.lowPriority + coefficients.ageCoefficient;

      expect(calculator.getUrgency(task)).toBe(expectedUrgency);
    });

    it('should correctly calculate urgency for a medium priority task', () => {
      task = taskFactory({
        priority: TaskPriority.Medium,
      });

      expect(calculator.getUrgency(task) & coefficients.mediumPriority).toEqual(
        coefficients.mediumPriority
      );
    });

    it('should use the Next tag coefficient if the "next" tag is present', () => {
      task = taskFactory({ tags: ['next'] });

      expect(calculator.getUrgency(task) & coefficients.nextTag).toEqual(coefficients.nextTag);
    });
  });

  describe('nearOrPastDueDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should return true if the due date is today', () => {
      const today = new Date('2024-08-08T12:00:00Z');
      vi.setSystemTime(today);
      expect(calculator.nearOrPastDueDate('2024-08-08')).toBe(true);
    });

    it('should return true if the due date is in the past', () => {
      const today = new Date('2024-08-08T12:00:00Z');
      vi.setSystemTime(today);
      expect(calculator.nearOrPastDueDate('2024-08-07')).toBe(true);
    });

    it('should return true if the due date is within the next 5 days', () => {
      const today = new Date('2024-08-08T12:00:00Z');
      vi.setSystemTime(today);

      // 4 days from now is within the range
      const fourDaysFromNow = new Date(today);
      fourDaysFromNow.setDate(today.getDate() + 4);

      // The `toISOString()` part is important to match the input format
      expect(calculator.nearOrPastDueDate(fourDaysFromNow.toISOString())).toBe(true);
    });

    it('should return false if the due date is more than 5 days in the future', () => {
      const today = new Date('2024-08-08T12:00:00Z');
      vi.setSystemTime(today);

      // 6 days from now is outside the range
      const sixDaysFromNow = new Date(today);
      sixDaysFromNow.setDate(today.getDate() + 6);

      expect(calculator.nearOrPastDueDate(sixDaysFromNow.toISOString())).toBe(false);
    });

    it('should return false if no due date is provided', () => {
      expect(calculator.nearOrPastDueDate(undefined)).toBe(false);
    });
  });
});
