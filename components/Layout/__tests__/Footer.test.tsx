import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { DataSource } from '@/data/DataSource';
import { render, screen } from '@/test-utils';
import { createTestLocalDataSource } from '@/test-utils/db';
import Footer from '../Footer';

describe('Footer', () => {
  let dataSource: DataSource;
  let database: PouchDB.Database;

  beforeEach(() => {
    const testSetup = createTestLocalDataSource();
    dataSource = testSetup.dataSource;
    database = testSetup.database;
  });

  afterEach(async () => {
    await dataSource.cleanup();
    await database.destroy();
  });

  it('Shows the database version', () => {
    const spy = jest.spyOn(dataSource, 'getVersion').mockReturnValue(987);

    render(
      <DataSourceContextProvider dataSource={dataSource}>
        <Footer />
      </DataSourceContextProvider>
    );

    expect(screen.getByText('DB version 987')).toBeInTheDocument();
    spy.mockRestore();
  });
});
