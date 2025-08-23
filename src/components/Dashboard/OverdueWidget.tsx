import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Anchor, List, Paper, Text, Title } from '@mantine/core';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';

export default function OverdueWidget() {
  const taskRepository = useTaskRepository();
  const [overdueTasks, setOverdueTasks] = useState<Task[] | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const tasks = await taskRepository.getTasks({
          statuses: [TaskStatus.Ready, TaskStatus.Started],
          due: true,
          dueWithin: {
            includeOverdueTasks: true,
          },
        });

        // Filter to only overdue tasks
        const today = dayjs().format('YYYY-MM-DD');
        const overdue = tasks.filter((task) => task.dueDate && task.dueDate < today);

        setOverdueTasks(overdue);
      } catch (error) {
        Logger.error('Error fetching tasks due this week:', error);
      }
    }

    fetchTasks();
  }, []);

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      {overdueTasks === null ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <Title order={3}>Overdue</Title>
          <List>
            {overdueTasks.length === 0 ? (
              <Text>No overdue tasks</Text>
            ) : (
              overdueTasks.map((task) => (
                <List.Item key={task._id}>
                  <Anchor href="#">{task.title}</Anchor>
                </List.Item>
              ))
            )}
          </List>
        </>
      )}
    </Paper>
  );
}
