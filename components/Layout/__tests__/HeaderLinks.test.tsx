import HeaderLinks from '@/components/Layout/HeaderLinks';
import { renderWithDataSource, screen } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';

jest.mock('@/components/Layout/NewItem/AddNewItemButton', () => ({
  __esModule: true,
  default: () => <div>Add new item</div>,
}));

describe('HeaderLinks', () => {
  const { getDataSource } = setupTestDatabase();

  it('Includes the AddNewItemButton component', () => {
    renderWithDataSource(<HeaderLinks />, getDataSource());

    expect(screen.getByText('Add new item')).toBeInTheDocument();
  });
});
