import { useLocation } from 'react-router-dom';
import ContextLinks from '@/components/Layout/ContextLinks';
import { setupTestDatabase } from '@/test-utils/db';
import { renderWithDataSource, screen } from '@/test-utils/index';

vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom');
  return {
    ...actual,
    useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
    useLocation: vi.fn().mockReturnValue({ pathname: '/' }),
  };
});

vi.mock('@/contexts/DataSourceContext', async () => {
  const actual = await import('@/contexts/DataSourceContext');
  return {
    ...actual,
    useContextRepository: () => {
      return {
        subscribeToContexts: vi.fn(),
      };
    },
  };
});

describe('ContextLinks', () => {
  const { getDataSource } = setupTestDatabase();
  const handleNavLinkClick = vi.fn();

  it('Renders no active context when no context is selected', async () => {
    renderWithDataSource(<ContextLinks handleNavLinkClick={handleNavLinkClick} />, getDataSource());

    expect(screen.getByTestId('context-link-none')).not.toHaveAttribute('data-active');
  });

  it('Marks the active context', async () => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/tasks',
      state: undefined,
      key: '',
      search: '',
      hash: '',
    });

    renderWithDataSource(<ContextLinks handleNavLinkClick={handleNavLinkClick} />, getDataSource());

    expect(screen.getByTestId('context-link-none')).toHaveAttribute('data-active');
  });
});
