import dayjs from 'dayjs';
import { IconClockCancel } from '@tabler/icons-react';
import { Badge, List, Paper, Text } from '@mantine/core';
import TaskListItem from '@/components/Dashboard/TaskListItem';
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
    <List listStyleType="none">
      {tasks &&
        tasks.map((task, index) => (
          <TaskListItem
            task={task}
            isEvenRow={index % 2 === 0}
            key={task._id}
            handleTaskClick={handleTaskClick}
            badge={
              <Badge color="red" size="xs" ml={10} variant="light">
                {dayjs(task.dueDate).format('MM/DD')}
              </Badge>
            }
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
          <WidgetTitle title="Overdue Tasks" icon={<IconClockCancel color="red" size={18} />} />
          {tasks.length === 0 ? <Text>No overdue tasks</Text> : listOfTasks}
        </>
      )}
    </Paper>
  );
}
