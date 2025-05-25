import { useRouter } from 'next/router';
import ContextLinks from '@/components/Layout/ContextLinks';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { render, screen, waitFor } from '@/test-utils';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockGetContexts = jest.fn().mockResolvedValue(['context1', 'context2']);
const mockDataSource = {
  getContexts: mockGetContexts,
};
jest.mock('@/contexts/DataSourceContext', () => ({
  ...jest.requireActual('@/contexts/DataSourceContext'),
  useDataSource: () => mockDataSource,
}));

describe('ContextLinks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({});
  });

  const getLinkDescriptionElement = (linkText: string) => {
    const navLink = screen.getByRole('link', { name: linkText });
    return navLink.querySelector('.mantine-NavLink-description');
  };

  it('Gets contexts from data source', async () => {
    render(
      <DataSourceContextProvider>
        <ContextLinks />
      </DataSourceContextProvider>
    );

    await waitFor(() => {
      expect(mockGetContexts).toHaveBeenCalledTimes(1);
      expect(getLinkDescriptionElement('context1')).toBeInTheDocument();
      expect(getLinkDescriptionElement('context2')).toBeInTheDocument();
    });
  });

  it('Renders no active context when no context is selected', async () => {
    render(
      <DataSourceContextProvider>
        <ContextLinks />
      </DataSourceContextProvider>
    );

    await waitFor(() => {
      expect(getLinkDescriptionElement('context1')).not.toHaveAttribute('data-active');
      expect(getLinkDescriptionElement('context2')).not.toHaveAttribute('data-active');
    });
  });

  it('Marks the active context', async () => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { context: 'context1' },
    });

    render(
      <DataSourceContextProvider>
        <ContextLinks />
      </DataSourceContextProvider>
    );

    await waitFor(() => {
      expect(getLinkDescriptionElement('context1')).toHaveAttribute('data-active');
      expect(getLinkDescriptionElement('context2')).not.toHaveAttribute('data-active');
    });
  });
});
