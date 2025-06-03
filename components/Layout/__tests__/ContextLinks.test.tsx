import { useRouter } from 'next/router';
import ContextLinks from '@/components/Layout/ContextLinks';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { DocumentTypes } from '@/data/documentTypes';
import { LocalDataSource } from '@/data/LocalDataSource';
import { render, screen, waitFor } from '@/test-utils';
import { createTestLocalDataSource } from '@/test-utils/db';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockSubscribeToContexts = jest.fn((callback) => {
  callback(['context1', 'context2']);
  return () => {};
});
const mockDataSource = {
  subscribeToContexts: mockSubscribeToContexts,
};
jest.mock('@/contexts/DataSourceContext', () => ({
  ...jest.requireActual('@/contexts/DataSourceContext'),
  useDataSource: () => mockDataSource,
}));

describe('ContextLinks', () => {
  let dataSource: LocalDataSource;
  let db: PouchDB.Database<DocumentTypes>;
  const handleNavLinkClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({});

    const testData = createTestLocalDataSource();
    dataSource = testData.dataSource;
    db = testData.database;
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('Gets contexts from data source', async () => {
    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <ContextLinks handleNavLinkClick={handleNavLinkClick} />
      </DataSourceContextProvider>
    );

    await waitFor(() => {
      expect(mockSubscribeToContexts).toHaveBeenCalledTimes(1);
      // There must be an accessible way to do this... @TODO
      expect(screen.getByTestId('context-link-context1')).toBeInTheDocument();
      expect(screen.getByTestId('context-link-context2')).toBeInTheDocument();
    });
  });

  it('Renders no active context when no context is selected', async () => {
    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <ContextLinks handleNavLinkClick={handleNavLinkClick} />
      </DataSourceContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('context-link-context1')).not.toHaveAttribute('data-active');
      expect(screen.getByTestId('context-link-context2')).not.toHaveAttribute('data-active');
    });
  });

  it('Marks the active context', async () => {
    (useRouter as jest.Mock).mockReturnValue({
      query: { name: 'context1' },
      pathname: '/contexts/view',
    });

    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <ContextLinks handleNavLinkClick={handleNavLinkClick} />
      </DataSourceContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('context-link-context1')).toHaveAttribute('data-active');
      expect(screen.getByTestId('context-link-context2')).not.toHaveAttribute('data-active');
    });
  });
});
