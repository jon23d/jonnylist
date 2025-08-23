import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { IconCalendar } from '@tabler/icons-react';
import { Badge, List, Paper, Text } from '@mantine/core';
import TaskListItem from '@/components/Dashboard/TaskListItem';
import WidgetTitle from '@/components/Dashboard/WidgetTitle';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';

export default function DueThisWeekWidget({
  handleTaskClick,
}: {
  handleTaskClick: (task: Task) => void;
}) {
  const taskRepository = useTaskRepository();
  const [tasksDueThisWeek, setTasksDueThisWeek] = useState<Task[] | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const tasks = await taskRepository.getTasks({
          statuses: [TaskStatus.Ready, TaskStatus.Started],
          dueWithin: {
            maximumNumberOfDaysFromToday: 7,
            includeOverdueTasks: false,
          },
        });
        setTasksDueThisWeek(tasks);
      } catch (error) {
        Logger.error('Error fetching tasks due this week:', error);
      }
    }

    fetchTasks();
  }, []);

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
      {tasksDueThisWeek &&
        tasksDueThisWeek.map((task, index) => (
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
      {tasksDueThisWeek === null ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <WidgetTitle
            title="Due in the Next 7 Days"
            icon={<IconCalendar color="orange" size={18} />}
          />

          {tasksDueThisWeek.length === 0 ? <Text>No tasks due this week</Text> : listOfTasks}
        </>
      )}
    </Paper>
  );
}
