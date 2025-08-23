import { useEffect, useState } from 'react';
import { Anchor, Paper, Table, Text, Title } from '@mantine/core';
import { useTaskRepository } from '@/contexts/DataSourceContext';
import { Task, TaskStatus } from '@/data/documentTypes/Task';

interface ProjectStats {
  project: string;
  open: number;
  closed: number;
}

export default function ProjectsWidget() {
  const taskRepository = useTaskRepository();
  const [projects, setProjects] = useState<ProjectStats[] | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      const tasks = await taskRepository.getTasks({
        statuses: [TaskStatus.Started, TaskStatus.Ready, TaskStatus.Waiting],
      });

      // remove tasks without a project
      const filteredTasks = tasks.filter((task) => !!task.project);

      const grouped = groupTasksByProject(filteredTasks);

      const projects = Object.entries(grouped).map(([project, tasks]) => {
        const open = tasks.filter((task) => {
          return (
            task.status === TaskStatus.Started ||
            task.status === TaskStatus.Ready ||
            task.status === TaskStatus.Waiting
          );
        }).length;

        const closed = tasks.length - open;

        return { project, open, closed };
      });

      setProjects(projects);
    };

    fetchTasks();
  }, []);

  const groupTasksByProject = (tasks: Task[]): Record<string, Task[]> => {
    return tasks.reduce(
      (acc, task) => {
        if (task.project) {
          if (!acc[task.project]) {
            acc[task.project] = [];
          }
          acc[task.project].push(task);
        }
        return acc;
      },
      {} as Record<string, Task[]>
    );
  };

  if (!projects) {
    return (
      <Paper shadow="smw" radius="md" withBorder p="lg">
        <Text>Loading...</Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="smw" radius="md" withBorder p="lg">
      <Title order={3}>Projects</Title>
      <Table verticalSpacing="2">
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>Open</Table.Th>
            <Table.Th>Closed</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {projects.map((project) => (
            <Table.Tr key={project.project}>
              <Table.Td>
                <Anchor>{project.project}</Anchor>
              </Table.Td>
              <Table.Td>{project.open}</Table.Td>
              <Table.Td>{project.closed}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
