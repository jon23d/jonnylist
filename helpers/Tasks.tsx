import React from 'react';
import { Badge } from '@mantine/core';
import { Task, TaskPriority, TaskStatus } from '@/data/documentTypes/Task';

type Coefficient = (task: Task) => number;

const coefficients: Coefficient[] = [
  // Is there a next tag?
  (task) => (task.tags?.includes('next') ? 15.0 : 0),
  // Is the due date near or past?
  (task) => (nearOrPastDueDate(task.dueDate) ? 12.0 : 0),
  // Is the task high priority?
  (task) => (task.priority === TaskPriority.High ? 6.0 : 0),
  // Is the task medium priority?
  (task) => (task.priority === TaskPriority.Medium ? 3.9 : 0),
  // Is the task low priority?
  (task) => (task.priority === TaskPriority.Low ? 1.8 : 0),
  // Has the task begun?
  (task) => (task.status === TaskStatus.Started ? 8.0 : 0),
  // Does it have a description?
  (task) => (task.description ? 1.0 : 0),
  // Does it have tags?
  (task) => (task.tags?.length ? 1.0 : 0),
  // Does it have a project?
  (task) => (task.project ? 1.0 : 0),
  // What about its age?
  (task) => 2.0 * (getAgeInDays(task.createdAt) / 365),
];

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

  const now = new Date();
  const dueDate = new Date(date);

  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(now.getDate() - 5);

  return dueDate >= fiveDaysAgo;
};

export const getUrgency = (task: Task): number => {
  return coefficients.reduce((total, coefficient) => total + coefficient(task), 0);
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
