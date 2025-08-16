import { render, screen, userEvent } from '@/test-utils/index';
import AddNewItemButton from '../AddNewItemButton';

vi.mock('@/components/Layout/NewItem/NewTaskForm', () => ({
  __esModule: true,
  default: () => <div>new task form mock</div>,
}));

describe('AddNewItemButton', () => {
  it('Opens the new task form when "a" is pressed', async () => {
    render(<AddNewItemButton />);

    await userEvent.keyboard('a');

    expect(screen.getByText('new task form mock')).toBeInTheDocument();
  });
});
