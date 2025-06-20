import Settings from '@/components/Contexts/Settings';
import { DocumentTypes } from '@/data/documentTypes';
import { LocalDataSource } from '@/data/LocalDataSource';
import { renderWithDatasource, screen, waitFor } from '@/test-utils';
import { createTestLocalDataSource } from '@/test-utils/db';

describe('Settings', () => {
  let dataSource: LocalDataSource;
  let db: PouchDB.Database<DocumentTypes>;

  beforeEach(() => {
    const testData = createTestLocalDataSource();
    dataSource = testData.dataSource;
    db = testData.database;
  });

  afterEach(async () => {
    await dataSource.cleanup();
    await db.destroy();
  });

  it('Loads and renders other contexts in a radio group', async () => {
    const contextNames = ['context1', 'context2', 'context3'];
    await Promise.all(contextNames.map((name) => dataSource.addContext(name)));

    renderWithDatasource(<Settings contextName="context1" />, dataSource);

    expect(screen.getByText('Choose destination context')).toBeInTheDocument();

    // We should only see radio buttons for other contexts
    await waitFor(() => {
      expect(screen.getByLabelText('context2')).toBeInTheDocument();
      expect(screen.getByLabelText('context3')).toBeInTheDocument();
    });
  });
});
