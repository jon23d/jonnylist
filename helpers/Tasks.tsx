import React from 'react';
import { Badge } from '@mantine/core';
import { Task, TaskPriority, TaskStatus } from '@/data/documentTypes/Task';

export type BaseCoefficients = {
  nextTag: number;
  nearDueDate: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  startedStatus: number;
  hasDescription: number;
  hasTags: number;
  hasProject: number;
  ageCoefficient: number;
};

export const defaultCoefficients: BaseCoefficients = {
  nextTag: 15.0,
  nearDueDate: 12.0,
  highPriority: 6.0,
  mediumPriority: 3.9,
  lowPriority: 1.8,
  startedStatus: 8.0,
  hasDescription: 1.0,
  hasTags: 1.0,
  hasProject: 1.0,
  ageCoefficient: 2.0,
};

/*
const coefficients = {
urgency.blocking.coefficient                 8.0 # blocking other tasks
urgency.scheduled.coefficient                5.0 # scheduled tasks
urgency.user.project.My Project.coefficient  5.0 # assigned to project:"My Project"
urgency.waiting.coefficient                 -3.0 # waiting task
urgency.blocked.coefficient
}*/

export const getAgeInDays = (createdAt: Date): number => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdAt.getTime());
  const ageInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return ageInDays <= 365 ? ageInDays : 365;
};

const nearOrPastDueDate = (date: string | undefined): boolean => {
  if (!date) {
    return false;
  }

  // Return true if the due date is within the next 5 days or has already passed
  const now = new Date();
  const dueDate = new Date(date);
  const fiveDaysFromNow = new Date(now);
  fiveDaysFromNow.setDate(now.getDate() + 5);

  return dueDate <= fiveDaysFromNow;
};

export const describeRecurrence = (task: Task): string => {
  if (!task.recurrence) {
    return 'None';
  }

  const { frequency, interval } = task.recurrence;

  if (frequency === 'daily') {
    if (interval === 1) {
      return 'Daily';
    }
    return `Every ${interval} days`;
  }

  if (frequency === 'weekly') {
    const dayOfWeek = task.recurrence.dayOfWeek;
    const dayString =
      dayOfWeek !== undefined
        ? `on ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]}`
        : '';
    const inflection = interval === 1 ? 'week' : `${interval} weeks`;
    return `Every ${inflection} ${dayString}`;
  }

  if (frequency === 'monthly') {
    const dayOfMonth = task.recurrence.dayOfMonth;
    if (dayOfMonth !== undefined) {
      return `Every ${interval} month(s) on the ${dayOfMonth}${dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th'}`;
    }
    return `Every ${interval} month(s)`;
  }

  if (frequency === 'yearly') {
    const firstOccurrence = task.recurrence.yearlyFirstOccurrence;
    if (firstOccurrence) {
      return `Every ${interval} year(s) starting from ${new Date(firstOccurrence).toLocaleDateString()}`;
    }
    return `Every ${interval} year(s)`;
  }

  return 'Unknown recurrence';
};

export const priorityBadge = (priority?: TaskPriority) => {
  switch (priority) {
    case TaskPriority.Low:
      return <Badge color="gray.4">L</Badge>;
    case TaskPriority.Medium:
      return <Badge color="lime.4">M</Badge>;
    case TaskPriority.High:
      return <Badge color="yellow.5">H</Badge>;
    default:
      return null;
  }
};
