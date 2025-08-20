import { UrgencyCalculator } from '@/helpers/UrgencyCalculator';
import { preferencesFactory } from '@/test-utils/factories/PreferencesFactory';
import { taskFactory } from '@/test-utils/factories/TaskFactory';

describe('UrgencyCalculator', () => {
  it('calculates urgency with custom coefficients', () => {
    const preferences = preferencesFactory({
      coefficients: {
        hasTags: 0,
        hasProject: 0,
        mediumPriority: 0,
        hasDescription: 0,
        ageCoefficient: 0,
        customCoefficients: [
          { type: 'tag', name: 'urgent', value: 100 },
          { type: 'project', name: 'work', value: 50 },
        ],
      },
    });

    const calculator = new UrgencyCalculator(preferences);

    const taskWithTag = taskFactory({ tags: ['urgent'], project: '', description: '' });
    const taskWithProject = taskFactory({ project: 'work', tags: [], description: '' });
    const taskWithBoth = taskFactory({
      tags: ['urgent'],
      project: 'work',
      description: '',
    });
    const taskWithNeither = taskFactory({ tags: [], project: '', description: '' });

    // Base urgency is 0 for a new task with no other attributes
    expect(calculator.getUrgency(taskWithTag)).toBe(100);
    expect(calculator.getUrgency(taskWithProject)).toBe(50);
    expect(calculator.getUrgency(taskWithBoth)).toBe(150);
    expect(calculator.getUrgency(taskWithNeither)).toBe(0);
  });
});
