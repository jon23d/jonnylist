import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { Button, Group, Modal, SimpleGrid, Title } from '@mantine/core';
import { useDisclosure, useViewportSize } from '@mantine/hooks';
import DueThisWeekWidget from '@/components/Dashboard/DueThisWeekWidget';
import HeatmapWidget from '@/components/Dashboard/HeatmapWidget';
import Intro from '@/components/Dashboard/Intro';
import OverdueWidget from '@/components/Dashboard/OverdueWidget';
import ProjectsWidget from '@/components/Dashboard/ProjectsWidget';
import StartedTasksWidget from '@/components/Dashboard/StartedTasksWidget';
import TasksCompletedWidget from '@/components/Dashboard/TasksCompletedWidget';
import EditTaskForm from '@/components/Tasks/EditTaskForm';
import { usePreferencesRepository, useTaskRepository } from '@/contexts/DataSourceContext';
import { Preferences } from '@/data/documentTypes/Preferences';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';

export default function Page() {
  const preferencesRepository = usePreferencesRepository();
  const taskRepository = useTaskRepository();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Task[] | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editorOpened, { open, close }] = useDisclosure(false);
  const { height: viewportHeight, width: viewportWidth } = useViewportSize();

  const [tasksDueThisWeek, setTasksDueThisWeek] = useState<Task[] | null>(null);
  const [overdueTasks, setOverdueTasks] = useState<Task[] | null>(null);
  const [startedTasks, setStartedTasks] = useState<Task[] | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[] | null>(null);

  const showEditDialog = (task: Task) => {
    setSelectedTask(task);
    open();
  };

  const cancelEditing = () => {
    setSelectedTask(null);
    close();
  };

  // We need preferences to determine whether to show or hide the intro
  useEffect(() => {
    async function fetchPreferences() {
      try {
        const prefs = await preferencesRepository.getPreferences();
        setPreferences(prefs);
      } catch (error) {
        Logger.error('Error fetching preferences:', error);
      }
    }

    fetchPreferences();
  }, []);

  // We need the completed tasks for the heatmap and tasks completed widgets
  useEffect(() => {
    return taskRepository.subscribeToTasks({ statuses: [TaskStatus.Done] }, setCompletedTasks);
  }, []);

  // We need tasks due this week for the DueThisWeekWidget
  useEffect(() => {
    return taskRepository.subscribeToTasks(
      {
        statuses: [TaskStatus.Ready, TaskStatus.Started],
        dueWithin: {
          maximumNumberOfDaysFromToday: 7,
          includeOverdueTasks: false,
        },
      },
      setTasksDueThisWeek
    );
  }, []);

  // We need tasks that are overdue for the OverdueWidget
  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const filter = (tasks: Task[]) => tasks.filter((task) => task.dueDate && task.dueDate < today);

    return taskRepository.subscribeToTasks(
      {
        statuses: [TaskStatus.Ready, TaskStatus.Started],
        due: true,
        dueWithin: {
          includeOverdueTasks: true,
        },
      },
      (tasks) => setOverdueTasks(filter(tasks))
    );
  }, []);

  // We need started tasks for the StartedTasksWidget
  useEffect(() => {
    return taskRepository.subscribeToTasks(
      {
        statuses: [TaskStatus.Started],
      },
      setStartedTasks
    );
  }, []);

  // We need tasks for the project widget
  useEffect(() => {
    const filter = (tasks: Task[]) => tasks.filter((task) => !!task.project);

    return taskRepository.subscribeToTasks(
      {
        statuses: [TaskStatus.Started, TaskStatus.Ready, TaskStatus.Waiting],
      },
      (tasks) => setProjectTasks(filter(tasks))
    );
  }, []);

  if (preferences === null) {
    return <div>Loading...</div>;
  }

  const toggleIntro = async () => {
    const updatedPreferences = {
      ...preferences,
      dashboard: {
        ...preferences.dashboard,
        hideIntro: !preferences.dashboard?.hideIntro,
      },
    };
    const savedPreferences = await preferencesRepository.setPreferences(updatedPreferences);
    setPreferences(savedPreferences);
  };

  return (
    <>
      <Group justify="space-between" mb={20}>
        <Title order={1}>Welcome to JonnyList!</Title>
        {preferences.dashboard?.hideIntro === true && (
          <Button onClick={toggleIntro}>Show intro</Button>
        )}
      </Group>

      {preferences.dashboard?.hideIntro !== true && <Intro toggleIntro={toggleIntro} />}

      <SimpleGrid cols={{ sm: 1, md: 2, lg: 3 }} spacing="xl">
        <HeatmapWidget completedTasks={completedTasks} />
        <TasksCompletedWidget completedTasks={completedTasks} />

        <OverdueWidget tasks={overdueTasks} handleTaskClick={showEditDialog} />
        <DueThisWeekWidget tasks={tasksDueThisWeek} handleTaskClick={showEditDialog} />
        <ProjectsWidget tasks={projectTasks} />
        <StartedTasksWidget tasks={startedTasks} handleTaskClick={showEditDialog} />
      </SimpleGrid>

      <Modal
        opened={editorOpened}
        onClose={close}
        title="Edit Task"
        size="lg"
        fullScreen={viewportWidth < 768 || viewportHeight < 500}
      >
        {selectedTask && <EditTaskForm task={selectedTask} handleClose={cancelEditing} />}
      </Modal>
    </>
  );
}
