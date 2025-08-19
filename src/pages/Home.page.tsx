import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Heatmap } from '@mantine/charts';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Grid,
  Group,
  List,
  Paper,
  SimpleGrid,
  Table,
  Text,
  Title,
  Typography,
} from '@mantine/core';
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

  const heatMapCellLabel = ({ date, value }: { date: string; value: number | null }) => {
    const dt = dayjs(date).format('DD MMM, YYYY');
    if (value === null || value === 0) {
      return `${dt} - Nothing completed`;
    }

    return `${dt} - ${value} task${value > 1 ? 's' : ''} completed`;
  };

  const heatMapData = (): Record<string, number> => {
    const data: Record<string, number> = {};
    const startDate = dayjs().subtract(3, 'month');
    const endDate = dayjs();
    let currentDate = startDate;
    while (currentDate.isBefore(endDate)) {
      const dateKey = currentDate.format('YYYY-MM-DD');
      data[dateKey] = Math.floor(Math.random() * 10); // Random number between 0 and 9
      currentDate = currentDate.add(1, 'day');
    }
    return data;
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

      <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xl">
        <Paper shadow="sm" radius="md" withBorder p="lg">
          <Heatmap
            withTooltip
            withWeekdayLabels
            withMonthLabels
            getTooltipLabel={heatMapCellLabel}
            startDate={dayjs().subtract(3, 'month').toDate()}
            data={heatMapData()}
          />
        </Paper>

        <Paper shadow="sm" radius="md" withBorder p="lg">
          <Title order={3}>Tasks completed</Title>
          <Text size="100px">387</Text>
        </Paper>

        <Paper shadow="sm" radius="md" withBorder p="lg">
          <Title order={3}>Due this week</Title>
          <List>
            <List.Item>
              <Anchor>
                Do not update status in form when waitUntil is present. Let taskrepo take care of it
              </Anchor>
              <Badge color="yellow" ml={10}>
                Today
              </Badge>
            </List.Item>
            <List.Item>
              <Anchor>Refreshes result in a 404</Anchor>
            </List.Item>
            <List.Item>
              <Anchor>Move to vite</Anchor>
            </List.Item>
          </List>
        </Paper>

        <Paper shadow="sm" radius="md" withBorder p="lg">
          <Title order={3}>Overdue</Title>
          <List>
            <List.Item>
              <Anchor>
                Do not update status in form when waitUntil is present. Let taskrepo take care of it
              </Anchor>
            </List.Item>
            <List.Item>
              <Anchor>Refreshes result in a 404</Anchor>
            </List.Item>
            <List.Item>
              <Anchor>Move to vite</Anchor>
            </List.Item>
          </List>
        </Paper>

        <Paper shadow="smw" radius="md" withBorder p="lg">
          <Title order={3}>Projects</Title>
          <Table verticalSpacing="2">
            <Table.Thead>
              <Table.Tr>
                <Table.Th />
                <Table.Th>Open</Table.Th>
                <Table.Th>Closed</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>No project</Table.Td>
                <Table.Td>11</Table.Td>
                <Table.Td>273</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Anchor>Project 1</Anchor>
                </Table.Td>
                <Table.Td>5</Table.Td>
                <Table.Td>2</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Anchor>Project 2</Anchor>
                </Table.Td>
                <Table.Td>3</Table.Td>
                <Table.Td>1</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Anchor>Project 3</Anchor>
                </Table.Td>
                <Table.Td>8</Table.Td>
                <Table.Td>0</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Paper>

        <Paper shadow="smw" radius="md" withBorder p="lg">
          <Title order={3}>Started tasks</Title>
          <List>
            <List.Item>
              <Anchor>
                Do not update status in form when waitUntil is present. Let taskrepo take care of it
              </Anchor>
            </List.Item>
            <List.Item>
              <Anchor>Refreshes result in a 404</Anchor>
            </List.Item>
            <List.Item>
              <Anchor>Move to vite</Anchor>
            </List.Item>
          </List>
        </Paper>
      </SimpleGrid>
    </>
  );
}
