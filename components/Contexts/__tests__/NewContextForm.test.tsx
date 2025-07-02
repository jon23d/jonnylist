import NewContextForm from '@/components/Contexts/NewContextForm';
import { render, screen, userEvent } from '@/test-utils';

const mockAddContext = jest.fn().mockResolvedValue(undefined);
jest.mock('@/contexts/DataSourceContext', () => ({
  useDataSource: () => ({
    addContext: mockAddContext,
  }),
}));

describe('NewContextForm', () => {
  it('Adds a new context to the data source', async () => {
    const mockOnClose = jest.fn();
    render(<NewContextForm onClose={mockOnClose} />);

    const textInput = screen.getByText('Context name');
    const saveButton = screen.getByRole('button', { name: 'Save' });

    await userEvent.type(textInput, 'Home');
    await userEvent.click(saveButton);

    // Assert that our specific mockAddContext function was called
    expect(mockAddContext).toHaveBeenCalledTimes(1);
    expect(mockAddContext).toHaveBeenCalledWith('Home');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('Validates context name input', async () => {
    const mockOnClose = jest.fn();
    render(<NewContextForm onClose={mockOnClose} />);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await userEvent.click(saveButton); // No input, should trigger validation

    expect(screen.getByText('Context name is required')).toBeInTheDocument();
    expect(mockAddContext).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
