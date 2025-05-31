import { useRouter } from 'next/router';
import PouchDB from 'pouchdb';
import ContextLinks from '@/components/Layout/ContextLinks';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { DocumentTypes } from '@/data/interfaces';
import { LocalDataSource } from '@/data/LocalDataSource';
import { render, screen, waitFor } from '@/test-utils';

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

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({});

    db = new PouchDB<DocumentTypes>(
      `test_db_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    );
    dataSource = new LocalDataSource(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  const getLinkDescriptionElement = (linkText: string) => {
    const navLink = screen.getByRole('link', { name: linkText });
    return navLink.querySelector('.mantine-NavLink-description');
  };

  it('Gets contexts from data source', async () => {
    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <ContextLinks />
      </DataSourceContextProvider>
    );

    await waitFor(() => {
      expect(mockSubscribeToContexts).toHaveBeenCalledTimes(1);
      expect(getLinkDescriptionElement('context1')).toBeInTheDocument();
      expect(getLinkDescriptionElement('context2')).toBeInTheDocument();
    });
  });

  it('Renders no active context when no context is selected', async () => {
    render(
      <DataSourceContextProvider dataSource={dataSource}>
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
      query: { name: 'context1' },
      pathname: '/contexts/view',
    });

    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <ContextLinks />
      </DataSourceContextProvider>
    );

    await waitFor(() => {
      expect(getLinkDescriptionElement('context1')).toHaveAttribute('data-active');
      expect(getLinkDescriptionElement('context2')).not.toHaveAttribute('data-active');
    });
  });
});
