import { waitFor } from '@testing-library/react';
import { spotlight } from '@mantine/spotlight';
import CommandPalette from '@/components/Layout/CommandPalette';
import { TaskStatus } from '@/data/documentTypes/Task';
import { setupTestDatabase } from '@/test-utils/db';
import { contextFactory } from '@/test-utils/factories/ContextFactory';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { renderWithDataSource, screen, userEvent } from '@/test-utils/index';

describe('CommandPalette', () => {
  const { getDataSource } = setupTestDatabase();

  afterEach(async () => {
    spotlight.close();
  });

  it('Opens the command palette when modifier-k is pressed', async () => {
    const dataSource = getDataSource();

    renderWithDataSource(<CommandPalette />, dataSource);

    // Simulate pressing modifier+k
    await userEvent.keyboard('{Meta>}{k}{/Meta}');

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });
  });

  it('Adds open tasks to the command palette', async () => {
    const dataSource = getDataSource();
    await dataSource.getTaskRepository().addTask(
      taskFactory({
        title: 'Test Task',
        description: 'This is a test task.',
        status: TaskStatus.Ready,
      })
    );

    renderWithDataSource(<CommandPalette />, dataSource);

    // Simulate pressing modifier+k
    await userEvent.keyboard('{Meta>}{k}{/Meta}');

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    // Click on the task to open it
    await userEvent.click(screen.getByText('Test Task'));

    // Check if the task editor opens
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
  });

  it('Adds contexts to the command palette actions', async () => {
    const dataSource = getDataSource();
    await dataSource.getContextRepository().addContext(contextFactory({ name: 'Work' }));

    renderWithDataSource(<CommandPalette />, dataSource);

    // Simulate pressing modifier+k
    await userEvent.keyboard('{Meta>}{k}{/Meta}');

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
    });
  });
});
