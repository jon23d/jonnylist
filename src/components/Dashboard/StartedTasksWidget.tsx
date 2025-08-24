import React from 'react';
import { IconClockPlay } from '@tabler/icons-react';
import { List, Paper, Text } from '@mantine/core';
import TaskListItem from '@/components/Dashboard/TaskListItem';
import WidgetTitle from '@/components/Dashboard/WidgetTitle';
import { Task } from '@/data/documentTypes/Task';

export default function StartedTasksWidget({
  tasks,
  handleTaskClick,
}: {
  tasks: Task[] | null;
  handleTaskClick: (task: Task) => void;
}) {
  const listOfTasks = (
    <List listStyleType="none">
      {tasks &&
        tasks.map((task, index) => (
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

      {tasks === null ? (
        <Text>Loading...</Text>
      ) : tasks.length === 0 ? (
        <Text>No in-progress tasks</Text>
      ) : (
        listOfTasks
      )}
    </Paper>
  );
}
