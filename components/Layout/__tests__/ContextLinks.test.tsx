import { useRouter } from 'next/router';
import ContextLinks from '@/components/Layout/ContextLinks';
import { renderWithDataSource, screen, waitFor } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockSubscribeToContexts = jest.fn((callback) => {
  callback(['context1', 'context2']);
  return () => {};
});
const mockContextRepository = {
  subscribeToContexts: mockSubscribeToContexts,
};
jest.mock('@/contexts/DataSourceContext', () => ({
  ...jest.requireActual('@/contexts/DataSourceContext'),
  useContextRepository: () => mockContextRepository,
}));

describe('ContextLinks', () => {
  const { getDataSource } = setupTestDatabase();
  const handleNavLinkClick = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({});
  });

  it('Gets contexts from data source', async () => {
    const dataSource = getDataSource();
    renderWithDataSource(<ContextLinks handleNavLinkClick={handleNavLinkClick} />, dataSource);

    await waitFor(() => {
      expect(mockSubscribeToContexts).toHaveBeenCalledTimes(1);
      // There must be an accessible way to do this... @TODO
      expect(screen.getByTestId('context-link-context1')).toBeInTheDocument();
      expect(screen.getByTestId('context-link-context2')).toBeInTheDocument();
    });
  });

  it('Renders no active context when no context is selected', async () => {
    const dataSource = getDataSource();
    renderWithDataSource(<ContextLinks handleNavLinkClick={handleNavLinkClick} />, dataSource);

    await waitFor(() => {
      expect(screen.getByTestId('context-link-context1')).not.toHaveAttribute('data-active');
      expect(screen.getByTestId('context-link-context2')).not.toHaveAttribute('data-active');
    });
  });

  it('Marks the active context', async () => {
    const dataSource = getDataSource();

    (useRouter as jest.Mock).mockReturnValue({
      query: { name: 'context1' },
      pathname: '/contexts/view',
    });

    renderWithDataSource(<ContextLinks handleNavLinkClick={handleNavLinkClick} />, dataSource);

    await waitFor(() => {
      expect(screen.getByTestId('context-link-context1')).toHaveAttribute('data-active');
      expect(screen.getByTestId('context-link-context2')).not.toHaveAttribute('data-active');
    });
  });
});
