import React, { useEffect, useState } from 'react';
import { IconClockPlay } from '@tabler/icons-react';
import { List, Paper, Text } from '@mantine/core';
import TaskListItem from '@/components/Dashboard/TaskListItem';
import WidgetTitle from '@/components/Dashboard/WidgetTitle';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';

export default function StartedTasksWidget({
  handleTaskClick,
}: {
  handleTaskClick: (task: Task) => void;
}) {
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
          <TaskListItem
            key={task._id}
            task={task}
            isEvenRow={index % 2 === 0}
            handleTaskClick={handleTaskClick}
          />
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
