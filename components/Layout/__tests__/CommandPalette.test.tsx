import { useRouter } from 'next/router';
import { waitFor } from '@testing-library/react';
import CommandPalette from '@/components/Layout/CommandPalette';
import { renderWithDataSource, screen, userEvent } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';

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
});
