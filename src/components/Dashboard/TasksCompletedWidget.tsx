import { Box, Center, Paper, Text, Title } from '@mantine/core';
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
            <Text size="100px">387</Text>
            <Title order={3}>Tasks completed</Title>
          </Box>
        )}
      </Center>
    </Paper>
  );
}
