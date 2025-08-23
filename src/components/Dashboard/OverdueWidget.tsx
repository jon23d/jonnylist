import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { IconClockCancel } from '@tabler/icons-react';
import { List, Paper, Text } from '@mantine/core';
import TaskListItem from '@/components/Dashboard/TaskListItem';
import WidgetTitle from '@/components/Dashboard/WidgetTitle';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';
import { Logger } from '@/helpers/Logger';

export default function OverdueWidget({
  handleTaskClick,
}: {
  handleTaskClick: (task: Task) => void;
}) {
  const taskRepository = useTaskRepository();
  const [overdueTasks, setOverdueTasks] = useState<Task[] | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const tasks = await taskRepository.getTasks({
          statuses: [TaskStatus.Ready, TaskStatus.Started],
          due: true,
          dueWithin: {
            includeOverdueTasks: true,
          },
        });

        // Filter to only overdue tasks
        const today = dayjs().format('YYYY-MM-DD');
        const overdue = tasks.filter((task) => task.dueDate && task.dueDate < today);

        setOverdueTasks(overdue);
      } catch (error) {
        Logger.error('Error fetching tasks due this week:', error);
      }
    }

    fetchTasks();
  }, []);

  const listOfTasks = (
    <List listStyleType="none">
      {overdueTasks &&
        overdueTasks.map((task, index) => (
          <TaskListItem
            task={task}
            isEvenRow={index % 2 === 0}
            key={task._id}
            handleTaskClick={handleTaskClick}
          />
        ))}
    </List>
  );

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      {overdueTasks === null ? (
        <Text>Loading...</Text>
      ) : (
        <>
          <WidgetTitle title="Overdue Tasks" icon={<IconClockCancel color="red" size={18} />} />
          {overdueTasks.length === 0 ? <Text>No overdue tasks</Text> : listOfTasks}
        </>
      )}
    </Paper>
  );
}
