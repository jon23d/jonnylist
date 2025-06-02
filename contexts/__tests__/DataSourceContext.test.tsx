import { DataSourceContextProvider, useDataSource } from '@/contexts/DataSourceContext';
import { DocumentTypes } from '@/data/documentTypes';
import { LocalDataSource } from '@/data/LocalDataSource';
import { render } from '@/test-utils';
import { createTestLocalDataSource } from '@/test-utils/db';

describe('DataSourceContextProvider', () => {
  let dataSource: LocalDataSource;
  let db: PouchDB.Database<DocumentTypes>;

  beforeEach(() => {
    const testData = createTestLocalDataSource();
    dataSource = testData.dataSource;
    db = testData.database;
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
    let observedDataSource: any;
    const TestComponent = () => {
      observedDataSource = useDataSource();
      return <></>;
    };

    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <TestComponent />
      </DataSourceContextProvider>
    );

    expect(observedDataSource).toBe(dataSource);
  });
});
