import { Preferences } from '@/data/documentTypes/Preferences';
import { Task, TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { BaseCoefficients, defaultCoefficients, getAgeInDays } from '@/helpers/Tasks';

export class UrgencyCalculator {
  private readonly coefficients: BaseCoefficients;

  constructor(preferences: Preferences) {
    this.coefficients = {
      ...defaultCoefficients,
      ...preferences.coefficients,
    };
  }

  getUrgency(task: Task): number {
    const coefficients = this.coefficients;
    const values = [
      task.tags?.includes('next') ? coefficients.nextTag : 0,
      this.nearOrPastDueDate(task.dueDate) ? coefficients.nearDueDate : 0,
      task.priority === TaskPriority.High ? coefficients.highPriority : 0,
      task.priority === TaskPriority.Medium ? coefficients.mediumPriority : 0,
      task.priority === TaskPriority.Low ? coefficients.lowPriority : 0,
      task.status === TaskStatus.Started ? coefficients.startedStatus : 0,
      task.description ? coefficients.hasDescription : 0,
      task.tags?.length ? coefficients.hasTags : 0,
      task.project ? coefficients.hasProject : 0,
      2.0 * (getAgeInDays(task.createdAt) / 365),
    ];

    return values.reduce((total, value) => total + value, 0);
  }

  // Return true if the due date is within the next 5 days or has already passed
  nearOrPastDueDate(date: string | undefined): boolean {
    if (!date) {
      return false;
    }

    const now = new Date();
    const dueDate = new Date(date);
    const fiveDaysFromNow = new Date(now);
    fiveDaysFromNow.setDate(now.getDate() + 5);

    return dueDate <= fiveDaysFromNow;
  }
}
