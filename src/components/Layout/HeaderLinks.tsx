import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Text } from '@mantine/core';
import AddNewItemButton from '@/components/Layout/NewItem/AddNewItemButton';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import classes from './Layout.module.css';

export default function HeaderLinks() {
  const [tasksDue, setTasksDue] = React.useState<Task[]>([]);
  const [tasksInProgress, setTasksInProgress] = React.useState<Task[]>([]);
  const [projectsInProgress, setProjectsInProgress] = React.useState<number>(0);
  const taskRepository = useTaskRepository();

  const extractProjectsFromTasks = (tasks: Task[]): void => {
    const projects = new Set<string>();
    tasks.forEach((task) => {
      if (task.project) {
        projects.add(task.project);
      }
    });
    setProjectsInProgress(projects.size);
  };

  useEffect(() => {
    // Get the number of tasks due today
    const unsubscribe = taskRepository.subscribeToTasks(
      {
        statuses: [TaskStatus.Ready, TaskStatus.Started],
        due: true,
      },
      setTasksDue
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Get the number of tasks due today
    const unsubscribe = taskRepository.subscribeToTasks(
      {
        statuses: [TaskStatus.Started],
      },
      setTasksInProgress
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Get the number of projects in progress
    const unsubscribe = taskRepository.subscribeToTasks(
      {
        statuses: [TaskStatus.Started, TaskStatus.Ready, TaskStatus.Waiting],
      },
      extractProjectsFromTasks
    );
    return unsubscribe;
  }, []);

  return (
    <>
      <AddNewItemButton />
      <div className={classes.withSeparators}>
        <Text size="xs" c="gray.6">
          <Anchor to="/reports/due" component={Link}>
            {tasksDue.length} tasks due
          </Anchor>
          <Anchor to="/reports/in-progress" component={Link}>
            {tasksInProgress.length} tasks in progress
          </Anchor>
          <Anchor to="/reports/open-projects" visibleFrom="xs" component={Link}>
            {projectsInProgress} open projects
          </Anchor>
        </Text>
      </div>
    </>
  );
}
