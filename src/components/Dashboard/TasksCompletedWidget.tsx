import React from 'react';
import { IconCheck } from '@tabler/icons-react';
import { Box, Center, Paper, Text } from '@mantine/core';
import WidgetTitle from '@/components/Dashboard/WidgetTitle';
import { Task } from '@/data/documentTypes/Task';

export default function TasksCompletedWidget({ completedTasks }: { completedTasks?: Task[] }) {
  const tasksCompleted = completedTasks?.length ?? null;

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      <Center>
        {tasksCompleted === null ? (
          <Text>Loading...</Text>
        ) : (
          <Box>
            <WidgetTitle title="In-Progress Tasks" icon={<IconCheck color="green" size={20} />} />
            <Text size="100px">{tasksCompleted}</Text>
          </Box>
        )}
      </Center>
    </Paper>
  );
}
