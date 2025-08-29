import { vi } from 'vitest';
import SaveContextModal from '@/components/Contexts/SaveContextModal';
import { setupTestDatabase } from '@/test-utils/db';
import { renderWithDataSource, screen, userEvent, waitFor } from '@/test-utils/index';

describe('SaveContextModal', () => {
  const { getDataSource } = setupTestDatabase();

  it('Saves the context when the form is submitted', async () => {
    const onCLose = vi.fn();
    renderWithDataSource(
      <SaveContextModal
        filter={{
          requireTags: ['tag1', 'tag2'],
        }}
        opened
        onClose={onCLose}
      />,
      getDataSource()
    );

    // We should not be able to click the save button yet because there is no context name set
    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();

    // Let's fill in a context name
    const contextNameInput = screen.getByLabelText('Context Name');
    await userEvent.type(contextNameInput, 'My Context');

    // Now the save button should be enabled
    expect(saveButton).toBeEnabled();
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Your context was created')).toBeInTheDocument();
    });

    // The input should be cleared
    expect(contextNameInput).toHaveValue('');

    // The modal should be closed
    expect(onCLose).toHaveBeenCalled();

    // And the context should be in the database
    const contexts = await getDataSource().getContextRepository().getContexts();
    expect(contexts).toHaveLength(1);
    expect(contexts[0]).toMatchObject({
      name: 'My Context',
      filter: {
        requireTags: ['tag1', 'tag2'],
      },
    });
  });
});
