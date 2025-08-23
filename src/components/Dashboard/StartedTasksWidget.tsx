import React, { useEffect, useState } from 'react';
import { IconClockPlay } from '@tabler/icons-react';
import { Anchor, Box, Center, Flex, Group, List, Paper, Text } from '@mantine/core';
import WidgetTitle from '@/components/Dashboard/WidgetTitle';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';

export default function StartedTasksWidget() {
  const taskRepository = useTaskRepository();
  const [startedTasks, setStartedTasks] = useState<Task[] | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      const tasks = await taskRepository.getTasks({
        statuses: [TaskStatus.Started],
      });
      setStartedTasks(tasks);
    };
    fetchTasks();
  }, []);

  const listOfTasks = (
    <List listStyleType="none">
      {startedTasks &&
        startedTasks.map((task, index) => (
          <List.Item key={task._id} bg={index % 2 === 0 ? 'gray.0' : ''} p="2" mb={3}>
            <Anchor href="#" size="sm">
              {task.title}
            </Anchor>
          </List.Item>
        ))}
    </List>
  );

  return (
    <Paper shadow="smw" radius="md" withBorder p="lg">
      <WidgetTitle title="In-Progress Tasks" icon={<IconClockPlay color="green" size={18} />} />

      {startedTasks === null ? (
        <Text>Loading...</Text>
      ) : startedTasks.length === 0 ? (
        <Text>No in-progress tasks</Text>
      ) : (
        listOfTasks
      )}
    </Paper>
  );
}
