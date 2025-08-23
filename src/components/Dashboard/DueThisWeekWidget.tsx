import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Anchor, Badge, List, Paper, Text, Title } from '@mantine/core';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';

export default function DueThisWeekWidget() {
  const taskRepository = useTaskRepository();
  const [tasksDueThisWeek, setTasksDueThisWeek] = useState<Task[] | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const tasks = await taskRepository.getTasks({
          statuses: [TaskStatus.Ready, TaskStatus.Started],
          dueWithin: {
            maximumNumberOfDaysFromToday: 7,
            includeOverdueTasks: false,
          },
        });
        setTasksDueThisWeek(tasks);
      } catch (error) {
        Logger.error('Error fetching tasks due this week:', error);
      }
    }

    fetchTasks();
  }, []);

  // Today in YYYY-MM-DD format
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      {tasksDueThisWeek === null ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Title order={3}>Due this week</Title>
          <List>
            {tasksDueThisWeek.length === 0 ? (
              <Text>No tasks due this week</Text>
            ) : (
              tasksDueThisWeek.map((task) => (
                <List.Item key={task._id}>
                  <Anchor href="#">{task.title}</Anchor>
                  {task.dueDate === today && (
                    <Badge color="orange" ml={10}>
                      Due today
                    </Badge>
                  )}
                </List.Item>
              ))
            )}
          </List>
        </>
      )}
    </Paper>
  );
}
