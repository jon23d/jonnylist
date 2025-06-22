import { renderWithDataSource, screen, userEvent } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import AddNewItemButton from '../AddNewItemButton';

jest.mock('@/components/Layout/NewItem/NewTaskForm', () => ({
  __esModule: true,
  default: () => <div>new task form mock</div>,
}));

jest.mock('@/components/Layout/NewItem/NewListItemForm', () => ({
  __esModule: true,
  default: () => <div>new list item form mock</div>,
}));

jest.mock('@/components/Layout/NewItem/NewMetricForm', () => ({
  __esModule: true,
  default: () => <div>new metric form mock</div>,
}));

describe('AddNewItemButton', () => {
  const { getDataSource } = setupTestDatabase();
  it('Opens the menu when "a" is pressed', async () => {
    renderWithDataSource(<AddNewItemButton />, getDataSource());

    await userEvent.keyboard('a');

    expect(screen.getByText('Metric')).toBeInTheDocument();
  });

  it('Renders the new task form when "Task" is clicked', async () => {
    renderWithDataSource(<AddNewItemButton />, getDataSource());

    await userEvent.click(screen.getByText('Add New (a)'));
    await userEvent.click(screen.getByText('Task'));

    expect(screen.getByText('Add New Task')).toBeInTheDocument();
    expect(screen.getByText('new task form mock')).toBeInTheDocument();
  });

  it('Renders the new list item form when "Item to list" is clicked', async () => {
    renderWithDataSource(<AddNewItemButton />, getDataSource());

    await userEvent.click(screen.getByText('Add New (a)'));
    await userEvent.click(screen.getByText('Item to list'));

    expect(screen.getByText('Add New Item to List')).toBeInTheDocument();
    expect(screen.getByText('new list item form mock')).toBeInTheDocument();
  });

  it('Renders the new metric form when "Metric" is clicked', async () => {
    renderWithDataSource(<AddNewItemButton />, getDataSource());

    await userEvent.click(screen.getByText('Add New (a)'));
    await userEvent.click(screen.getByText('Metric'));

    expect(screen.getByText('Add New Metric')).toBeInTheDocument();
    expect(screen.getByText('new metric form mock')).toBeInTheDocument();
  });
});
