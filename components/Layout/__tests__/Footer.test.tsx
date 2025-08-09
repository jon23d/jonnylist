import { DATABASE_VERSION } from '@/data/migrations/versions/Versions';
import { renderWithDataSource, screen, waitFor } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import Footer from '../Footer';

describe('Footer', () => {
  const { getDataSource } = setupTestDatabase();

  it('Shows the database version', async () => {
    const dataSource = getDataSource();

    renderWithDataSource(<Footer />, dataSource);

    await waitFor(() => {
      expect(screen.getByText(`DB version ${DATABASE_VERSION}`)).toBeInTheDocument();
    });
  });
});
