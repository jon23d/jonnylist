import PouchDB from 'pouchdb';
import { DataSourceContextProvider, useDataSource } from '@/contexts/DataSourceContext';
import { DocumentTypes } from '@/data/interfaces';
import { LocalDataSource } from '@/data/LocalDataSource';
import { render } from '@/test-utils';

describe('DataSourceContextProvider', () => {
  let dataSource: LocalDataSource;
  let db: PouchDB.Database<DocumentTypes>;

  beforeEach(() => {
    // I could never get the pouchdb-memory plugin to work with the test suite,
    // so we use a new database for each test. If we don't subsequent runs will fail
    db = new PouchDB<DocumentTypes>(
      `test_db_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    );
    dataSource = new LocalDataSource(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <DataSourceContextProvider dataSource={dataSource}>
        <div>Test</div>
      </DataSourceContextProvider>
    );

    expect(container).toBeInTheDocument();
  });

  it('Initializes the context with a default local data source', () => {
    let dataSource: any;
    const TestComponent = () => {
      dataSource = useDataSource();
      return <></>;
    };

    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <TestComponent />
      </DataSourceContextProvider>
    );

    expect(dataSource).toBeInstanceOf(LocalDataSource);
  });
});
