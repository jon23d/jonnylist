import { DataSourceContextProvider, useDataSource } from '@/contexts/DataSourceContext';
import { LocalDataSource } from '@/data/LocalDatasource';
import { render } from '@/test-utils';

describe('DataSourceContextProvider', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <DataSourceContextProvider>
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
      <DataSourceContextProvider>
        <TestComponent />
      </DataSourceContextProvider>
    );

    expect(dataSource).toBeInstanceOf(LocalDataSource);
  });
});
