import { useRouter } from 'next/router';
import ContextLinks from '@/components/Layout/ContextLinks';
import { render, screen, waitFor } from '@/test-utils';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('ContextLinks', () => {
  const handleNavLinkClick = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({});
  });

  it('Renders no active context when no context is selected', async () => {
    render(<ContextLinks handleNavLinkClick={handleNavLinkClick} />);

    await waitFor(() => {
      expect(screen.getByTestId('context-link-none')).not.toHaveAttribute('data-active');
    });
  });

  it('Marks the active context', async () => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { name: 'None' },
      pathname: '/tasks',
    });

    render(<ContextLinks handleNavLinkClick={handleNavLinkClick} />);

    await waitFor(() => {
      expect(screen.getByTestId('context-link-none')).toHaveAttribute('data-active');
    });
  });
});
