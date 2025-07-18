import { DATABASE_VERSION } from '@/data/migrations/versions/Versions';
import { renderWithDataSource, screen } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import Footer from '../Footer';

describe('Footer', () => {
  const { getDataSource } = setupTestDatabase();

  it('Shows the database version', () => {
    const dataSource = getDataSource();

    renderWithDataSource(<Footer />, dataSource);

    expect(screen.getByText(`DB version ${DATABASE_VERSION}`)).toBeInTheDocument();
  });
});
