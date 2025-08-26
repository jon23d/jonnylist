import React from 'react';
import { IconClockPlay } from '@tabler/icons-react';
import { Box, Paper, Text } from '@mantine/core';
import DashboardTaskListItem from '@/components/Dashboard/DashboardTaskListItem';
import WidgetTitle from '@/components/Dashboard/WidgetTitle';
import { Task } from '@/data/documentTypes/Task';

export default function InProgressTasksWidget({
  tasks,
  handleTaskClick,
}: {
  tasks: Task[] | null;
  handleTaskClick: (task: Task) => void;
}) {
  const listOfTasks = (
    <Box>
      {tasks &&
        tasks.map((task) => (
          <DashboardTaskListItem key={task._id} task={task} handleTaskClick={handleTaskClick} />
        ))}
    </Box>
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
