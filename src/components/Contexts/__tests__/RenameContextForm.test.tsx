import RenameContextForm from '@/components/Contexts/RenameContextForm';
import { Notifications } from '@/helpers/Notifications';
import { setupTestDatabase } from '@/test-utils/db';
import { contextFactory } from '@/test-utils/factories/ContextFactory';
import { renderWithDataSource, screen, userEvent, waitFor } from '@/test-utils/index';

vi.mock('@/helpers/Notifications', () => ({
  Notifications: {
    showError: vi.fn(),
  },
}));

describe('RenameContextForm', () => {
  const { getDataSource } = setupTestDatabase();

  test('Should render the form with the initial context name', () => {
    const context = contextFactory({
      name: 'name1',
    });

    renderWithDataSource(
      <RenameContextForm context={context} onClose={() => {}} />,
      getDataSource()
    );

    const input = screen.getByLabelText('Context Name');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('name1');
  });

  test('Should call updateContext and onClose on successful submission', async () => {
    const dataSource = getDataSource();
    const onClose = vi.fn();
    const context = contextFactory({
      name: 'name1',
    });

    renderWithDataSource(
      <RenameContextForm context={context} onClose={onClose} />,
      getDataSource()
    );

    const input = screen.getByLabelText('Context Name');
    await userEvent.clear(input);
    await userEvent.type(input, 'name2');

    const submitButton = screen.getByRole('button', { name: 'Rename Context' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });

    const updatedContext = await dataSource.getContextRepository().getContext(context._id);

    expect(updatedContext.name).toBe('name2');
  });

  test('Should show an error if the update fails', async () => {
    const mockShowError = vi.fn();
    vi.mocked(Notifications.showError).mockImplementation(mockShowError);
    const dataSource = getDataSource();
    const context = contextFactory({
      name: 'name1',
    });

    vi.spyOn(dataSource.getContextRepository(), 'updateContext').mockRejectedValue(
      new Error('Update failed')
    );

    renderWithDataSource(
      <RenameContextForm context={context} onClose={() => {}} />,
      getDataSource()
    );

    const input = screen.getByLabelText('Context Name');
    await userEvent.clear(input);
    await userEvent.type(input, 'name2');

    const submitButton = screen.getByRole('button', { name: 'Rename Context' });
    await userEvent.click(submitButton);

    expect(mockShowError).toHaveBeenCalledWith({
      title: 'Error',
      message: 'Failed to rename context: Error: Update failed',
    });
  });

  test('Should clear the input and close if cancel is clicked', async () => {
    const context = contextFactory({
      name: 'name1',
    });

    const onClose = vi.fn();

    renderWithDataSource(
      <RenameContextForm context={context} onClose={onClose} />,
      getDataSource()
    );

    const input = screen.getByLabelText('Context Name');
    await userEvent.clear(input);
    await userEvent.type(input, 'name2');

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
    expect(input).toHaveValue('');
  });

  test('It should disable the submit button if the context name is empty or unchanged', async () => {
    const context = contextFactory({
      name: 'name1',
    });

    renderWithDataSource(
      <RenameContextForm context={context} onClose={() => {}} />,
      getDataSource()
    );

    const input = screen.getByLabelText('Context Name');
    const submitButton = screen.getByRole('button', { name: 'Rename Context' });

    // Initially, the button should be disabled
    expect(submitButton).toBeDisabled();

    // Type a new name
    await userEvent.clear(input);
    await userEvent.type(input, 'name2');

    // Now the button should be enabled
    expect(submitButton).toBeEnabled();

    // Clear the input again
    await userEvent.clear(input);

    // The button should be disabled again
    expect(submitButton).toBeDisabled();

    // Type the same name again
    await userEvent.type(input, 'name1');

    // The button should still be disabled since the name is unchanged
    expect(submitButton).toBeDisabled();
  });
});
