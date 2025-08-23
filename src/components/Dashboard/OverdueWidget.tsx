import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { IconClockCancel, IconClockPlay } from '@tabler/icons-react';
import { Anchor, List, Paper, Text } from '@mantine/core';
import WidgetTitle from '@/components/Dashboard/WidgetTitle';
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

  const listOfTasks = (
    <List listStyleType="none">
      {overdueTasks &&
        overdueTasks.map((task, index) => (
          <List.Item key={task._id} bg={index % 2 === 0 ? 'gray.0' : ''} p="2" mb={3}>
            <Anchor href="#" size="sm">
              {task.title}
            </Anchor>
          </List.Item>
        ))}
    </List>
  );

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      {overdueTasks === null ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <WidgetTitle title="Overdue Tasks" icon={<IconClockCancel color="red" size={18} />} />
          {overdueTasks.length === 0 ? <Text>No overdue tasks</Text> : listOfTasks}
        </>
      )}
    </Paper>
  );
}
