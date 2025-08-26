import dayjs from 'dayjs';
import { IconCalendar } from '@tabler/icons-react';
import { Badge, Box, Paper, Text } from '@mantine/core';
import DashboardTaskListItem from '@/components/Dashboard/DashboardTaskListItem';
import WidgetTitle from '@/components/Dashboard/WidgetTitle';
import { Task } from '@/data/documentTypes/Task';

export default function DueThisWeekWidget({
  tasks,
  handleTaskClick,
}: {
  tasks: Task[] | null;
  handleTaskClick: (task: Task) => void;
}) {
  // Today in YYYY-MM-DD format
  const today = dayjs().format('YYYY-MM-DD');

  const dueTodayBadge = (task: Task) => {
    if (task.dueDate === today) {
      return (
        <Badge color="orange" size="xs" ml="5" mt={2} mb={5}>
          Due Today
        </Badge>
      );
    }
    return null;
  };

  const listOfTasks = (
    <Box>
      {tasks &&
        tasks.map((task) => (
          <DashboardTaskListItem
            key={task._id}
            task={task}
            badge={dueTodayBadge(task)}
            handleTaskClick={handleTaskClick}
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
          <WidgetTitle
            title="Due in the Next 7 Days"
            icon={<IconCalendar color="orange" size={18} />}
          />

          {tasks.length === 0 ? <Text>No tasks due within 7 days</Text> : listOfTasks}
        </>
      )}
    </Paper>
  );
}
