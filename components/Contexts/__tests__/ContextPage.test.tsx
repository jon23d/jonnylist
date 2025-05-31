import ContextPage from '@/components/Contexts/ContextPage';
import { render, screen, userEvent } from '@/test-utils';

jest.mock('@/components/Contexts/Views/Board/Board', () => () => <div>Board View</div>);
jest.mock('@/components/Contexts/Views/List/List', () => () => <div>List View</div>);
jest.mock('@/components/Contexts/Views/Calendar/Calendar', () => () => <div>Calendar View</div>);

describe('ContextPage', () => {
  it('Loads the list view by default', () => {
    render(<ContextPage contextName="Test Context" />);

    expect(screen.getByText('List View')).toBeInTheDocument();
  });

  it('Navigates to the list view after loading another', async () => {
    render(<ContextPage contextName="Test Context" />);

    await userEvent.click(screen.getByRole('radio', { name: 'Board' }));
    expect(screen.getByText('Board View')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'List' }));
    expect(screen.getByText('List View')).toBeInTheDocument();
  });

  it('Loads the board view', async () => {
    render(<ContextPage contextName="Test Context" />);

    await userEvent.click(screen.getByRole('radio', { name: 'Board' }));

    expect(screen.getByText('Board View')).toBeInTheDocument();
  });

  it('Loads the calendar view', async () => {
    render(<ContextPage contextName="Test Context" />);

    await userEvent.click(screen.getByRole('radio', { name: 'Board' }));

    expect(screen.getByText('Board View')).toBeInTheDocument();
  });
});
