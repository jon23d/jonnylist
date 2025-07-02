import { useRouter } from 'next/router';
import { waitFor } from '@testing-library/react';
import CommandPalette from '@/components/Layout/CommandPalette';
import { TaskStatus } from '@/data/documentTypes/Task';
import { renderWithDataSource, screen, userEvent } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import { taskFactory } from '@/test-utils/factories/TaskFactory';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('CommandPalette', () => {
  const { getDataSource } = setupTestDatabase();

  it('Opens the command palette when modifier-k is pressed', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    const dataSource = getDataSource();
    await dataSource.addContext('the circus');

    renderWithDataSource(<CommandPalette />, dataSource);

    // Simulate pressing modifier+k
    await userEvent.keyboard('{Meta>}{k}{/Meta}');

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByText('View context: the circus')).toBeInTheDocument();
    });

    // Choose the View context action
    await userEvent.click(screen.getByText('View context: the circus'));

    // Did we navigate to the context view?
    expect(mockPush).toHaveBeenCalledWith('/contexts/view?name=the circus');
  });

  it('Adds open tasks to the command palette', async () => {
    const dataSource = getDataSource();
    await dataSource.getTaskRepository().addTask(
      taskFactory({
        title: 'Test Task',
        description: 'This is a test task.',
        status: TaskStatus.Ready,
        context: 'General',
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
});
