import HeaderLinks from '@/components/Layout/HeaderLinks';
import { setupTestDatabase } from '@/test-utils/db';
import { renderWithDataSource, screen, waitFor } from '@/test-utils/index';

vi.mock('@/components/Layout/NewItem/AddNewItemButton', () => ({
  __esModule: true,
  default: () => <div>Add new item</div>,
}));

describe('HeaderLinks', () => {
  const { getDataSource } = setupTestDatabase();

  it('Includes the AddNewItemButton component', async () => {
    renderWithDataSource(<HeaderLinks />, getDataSource());

    await waitFor(() => expect(screen.getByText('Add new item')).toBeInTheDocument());
  });
});
