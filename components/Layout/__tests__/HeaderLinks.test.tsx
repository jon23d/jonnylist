import HeaderLinks from '@/components/Layout/HeaderLinks';
import { render, screen } from '@/test-utils';

jest.mock('@/components/Common/NewItem/AddNewItemButton', () => ({
  __esModule: true,
  default: () => <div>Add new item</div>,
}));

describe('HeaderLinks', () => {
  it('Includes the AddNewItemButton component', () => {
    render(<HeaderLinks />);

    expect(screen.getByText('Add new item')).toBeInTheDocument();
  });
});
