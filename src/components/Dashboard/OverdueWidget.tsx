import dayjs from 'dayjs';
import { IconClockCancel } from '@tabler/icons-react';
import { Badge, Box, Paper, Text } from '@mantine/core';
import DashboardTaskListItem from '@/components/Dashboard/DashboardTaskListItem';
import WidgetTitle from '@/components/Dashboard/WidgetTitle';
import { Task } from '@/data/documentTypes/Task';

export default function OverdueWidget({
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
          <DashboardTaskListItem
            task={task}
            key={task._id}
            handleTaskClick={handleTaskClick}
            badge={
              <Badge color="red" size="xs" ml={10} variant="light">
                {dayjs(task.dueDate).format('MM/DD')}
              </Badge>
            }
          />
        ))}
    </Box>
  );

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      {tasks === null ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <WidgetTitle title="Overdue Tasks" icon={<IconClockCancel color="red" size={18} />} />
          {tasks.length === 0 ? <Text>No overdue tasks</Text> : listOfTasks}
        </>
      )}
    </Paper>
  );
}
