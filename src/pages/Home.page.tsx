import { useEffect, useState } from 'react';
import {
  Anchor,
  Badge,
  Button,
  Group,
  List,
  Paper,
  SimpleGrid,
  Table,
  Text,
  Title,
  Typography,
} from '@mantine/core';
import DueThisWeekWidget from '@/components/Dashboard/DueThisWeekWidget';
import HeatmapWidget from '@/components/Dashboard/HeatmapWidget';
import Intro from '@/components/Dashboard/Intro';
import OverdueWidget from '@/components/Dashboard/OverdueWidget';
import ProjectsWidget from '@/components/Dashboard/ProjectsWidget';
import StartedTasksWidget from '@/components/Dashboard/StartedTasksWidget';
import TasksCompletedWidget from '@/components/Dashboard/TasksCompletedWidget';
import { usePreferencesRepository, useTaskRepository } from '@/contexts/DataSourceContext';
import { Preferences } from '@/data/documentTypes/Preferences';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';

/**
 * This component serves as the home page for JonnyList.
 *
 * It should serve two distinct audiences:
 *
 * 1. New users who are just getting started with the application.
 * 2. Existing users who are returning to the application.
 *
 * For new users, the page should provide a brief introduction to the application,
 * highlighting its purpose and key features. It should also include a list of
 * keyboard shortcuts to help them get started quickly.
 *
 * For existing users, the page should provide:
 *  - A list of contexts with some basic stats
 *  - A list of tasks that are due today
 *  - A list of tasks that are overdue
 *  - A summary of open projects
 *  - A summary of started tasks
 *  - A visual depiction of productivity over time
 *  - Simple task counters
 */

export default function Page() {
  const preferencesRepository = usePreferencesRepository();
  const taskRepository = useTaskRepository();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Task[] | undefined>(undefined);

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

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      const completedTasks = await taskRepository.getTasks({ statuses: [TaskStatus.Done] });
      setCompletedTasks(completedTasks);
    };
    fetchCompletedTasks();
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

        <OverdueWidget />
        <DueThisWeekWidget />
        <ProjectsWidget />
        <StartedTasksWidget />
      </SimpleGrid>
    </>
  );
}
