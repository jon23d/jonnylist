import { useRouter } from 'next/router';
import ContextLinks from '@/components/Layout/ContextLinks';
import { renderWithDataSource, screen, waitFor } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('ContextLinks', () => {
  const { getDataSource } = setupTestDatabase();
  const handleNavLinkClick = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({});
  });

  it('Renders no active context when no context is selected', async () => {
    renderWithDataSource(<ContextLinks handleNavLinkClick={handleNavLinkClick} />, getDataSource());

    await waitFor(() => {
      expect(screen.getByTestId('context-link-none')).not.toHaveAttribute('data-active');
    });
  });

  it('Marks the active context', async () => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { name: 'None' },
      pathname: '/tasks',
    });

    renderWithDataSource(<ContextLinks handleNavLinkClick={handleNavLinkClick} />, getDataSource());

    await waitFor(() => {
      expect(screen.getByTestId('context-link-none')).toHaveAttribute('data-active');
    });
  });
});
