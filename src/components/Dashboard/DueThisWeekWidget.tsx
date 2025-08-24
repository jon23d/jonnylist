import dayjs from 'dayjs';
import { IconCalendar } from '@tabler/icons-react';
import { Badge, List, Paper, Text } from '@mantine/core';
import TaskListItem from '@/components/Dashboard/TaskListItem';
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
    <List listStyleType="none">
      {tasks &&
        tasks.map((task, index) => (
          <TaskListItem
            key={task._id}
            task={task}
            isEvenRow={index % 2 === 0}
            badge={dueTodayBadge(task)}
            handleTaskClick={handleTaskClick}
          />
        ))}
    </List>
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
