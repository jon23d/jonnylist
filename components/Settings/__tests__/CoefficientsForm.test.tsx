import CoefficientsForm from '@/components/Settings/CoefficientsForm';
import { Notifications } from '@/helpers/Notifications';
import { renderWithDataSource, screen, userEvent, waitFor } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import { preferencesFactory } from '@/test-utils/factories/PreferencesFactory';

jest.mock('@/helpers/Notifications', () => ({
  Notifications: {
    showQuickSuccess: jest.fn(),
  },
}));

describe('CoefficientsForm', () => {
  const { getDataSource } = setupTestDatabase();

  it('Does not persist non-numeric values', async () => {
    const mockShowQuickSuccess = jest.fn();
    (Notifications.showQuickSuccess as jest.Mock).mockImplementation(mockShowQuickSuccess);

    renderWithDataSource(<CoefficientsForm preferences={preferencesFactory()} />, getDataSource());

    const nextTagInput = screen.getByLabelText('Next Tag');
    await userEvent.clear(nextTagInput);

    const submitButton = screen.getByRole('button', { name: 'Save Coefficients' });
    await userEvent.click(submitButton);

    expect(screen.getByText('Must be numeric')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockShowQuickSuccess).not.toHaveBeenCalled();
    });
  });
});
