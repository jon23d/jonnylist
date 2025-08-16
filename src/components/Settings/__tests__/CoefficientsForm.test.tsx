import CoefficientsForm from '@/components/Settings/CoefficientsForm';
import { Notifications } from '@/helpers/Notifications';
import { defaultCoefficients } from '@/helpers/Tasks';
import { setupTestDatabase } from '@/test-utils/db';
import { preferencesFactory } from '@/test-utils/factories/PreferencesFactory';
import { renderWithDataSource, screen, userEvent, waitFor } from '@/test-utils/index';

vi.mock('@/helpers/Notifications', () => ({
  Notifications: {
    showQuickSuccess: vi.fn(),
  },
}));

const setPreferencesMock = vi.fn();
const mockPreferencesRepository = {
  setPreferences: setPreferencesMock,
};
vi.mock('@/contexts/DataSourceContext', async () => {
  const actual = await import('@/contexts/DataSourceContext');
  return {
    ...actual,
    usePreferencesRepository: () => mockPreferencesRepository,
  };
});

describe('CoefficientsForm', () => {
  const { getDataSource } = setupTestDatabase();

  it('Does not persist non-numeric values', async () => {
    const mockShowQuickSuccess = vi.fn();
    vi.mocked(Notifications.showQuickSuccess).mockImplementation(mockShowQuickSuccess);

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

  it('Persists valid coefficients', async () => {
    renderWithDataSource(
      <CoefficientsForm
        preferences={preferencesFactory({
          coefficients: {
            nextTag: 1,
            nearDueDate: 2,
            highPriority: 3,
            mediumPriority: 4,
            lowPriority: 5,
            startedStatus: 6,
            hasDescription: 7,
            hasTags: 8,
            hasProject: 9,
            ageCoefficient: 10,
          },
        })}
      />,
      getDataSource()
    );

    const submitButton = screen.getByRole('button', { name: 'Save Coefficients' });
    await userEvent.click(submitButton);

    expect(setPreferencesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        coefficients: expect.objectContaining({
          nextTag: 1,
          nearDueDate: 2,
          highPriority: 3,
          mediumPriority: 4,
          lowPriority: 5,
          startedStatus: 6,
          hasDescription: 7,
          hasTags: 8,
          hasProject: 9,
          ageCoefficient: 10,
        }),
      })
    );
  });

  it('Uses default coefficients', async () => {
    renderWithDataSource(<CoefficientsForm preferences={preferencesFactory()} />, getDataSource());

    const resetButton = screen.getByRole('button', { name: 'Save Coefficients' });
    await userEvent.click(resetButton);

    expect(setPreferencesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        coefficients: expect.objectContaining({
          ...defaultCoefficients,
        }),
      })
    );
  });

  it('Resets to default coefficients', async () => {
    renderWithDataSource(
      <CoefficientsForm
        preferences={preferencesFactory({
          coefficients: {
            nextTag: 1,
            nearDueDate: 2,
            highPriority: 3,
            mediumPriority: 4,
            lowPriority: 5,
            startedStatus: 6,
            hasDescription: 7,
            hasTags: 8,
            hasProject: 9,
            ageCoefficient: 10,
          },
        })}
      />,
      getDataSource()
    );

    const resetButton = screen.getByRole('button', { name: 'Reset to Defaults' });
    await userEvent.click(resetButton);

    const submitButton = screen.getByRole('button', { name: 'Save Coefficients' });
    await userEvent.click(submitButton);

    expect(setPreferencesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        coefficients: expect.objectContaining({
          ...defaultCoefficients,
        }),
      })
    );
  });

  it('Uses the updated preference revision on subsequent submits', async () => {
    const initialPreferences = preferencesFactory({ _rev: 'abc-123' });
    vi.mocked(setPreferencesMock).mockResolvedValue({ ...initialPreferences, _rev: 'def-456' });

    renderWithDataSource(<CoefficientsForm preferences={initialPreferences} />, getDataSource());

    // First click
    const submitButton = screen.getByRole('button', { name: 'Save Coefficients' });
    await userEvent.click(submitButton);

    expect(setPreferencesMock).toHaveBeenCalledWith(expect.objectContaining({ _rev: 'abc-123' }));

    // Second click
    await userEvent.click(submitButton);
    expect(setPreferencesMock).toHaveBeenCalledWith(expect.objectContaining({ _rev: 'def-456' }));
  });
});
