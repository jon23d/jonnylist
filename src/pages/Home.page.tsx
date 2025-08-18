import { useEffect, useState } from 'react';
import { Button, Group, Paper, Title, Typography } from '@mantine/core';
import { usePreferencesRepository } from '@/contexts/DataSourceContext';
import { Preferences } from '@/data/documentTypes/Preferences';
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
  const [preferences, setPreferences] = useState<Preferences | null>(null);

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

      {preferences.dashboard?.hideIntro !== true && (
        <Paper shadow="md" withBorder p={20}>
          <Typography>
            <p>
              JonnyList is a task management application designed to fill the gaps in available
              offerings. It is is designed to help you maintain a high level of productivity by:
            </p>
            <ol>
              <li>Allowing you to capture tasks quickly and easily</li>
              <li>Organizing tasks into projects and contexts</li>
              <li>Automatically prioritizing tasks based on information you provide</li>
            </ol>
            <h2>Keyboard Shortcuts</h2>
            <ul>
              <li>
                <strong>Ctrl + K</strong> or <strong>Cmd + K</strong>: Open command palette
              </li>
              <li>
                <strong>a</strong>: Add a new task
              </li>
            </ul>
          </Typography>
          <Button onClick={toggleIntro}>Hide</Button>
        </Paper>
      )}
    </>
  );
}
