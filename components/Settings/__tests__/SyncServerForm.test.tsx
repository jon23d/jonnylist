import SyncServerForm from '@/components/Settings/SyncServerForm';
import { DataSource } from '@/data/DataSource';
import { renderWithDataSource, screen, userEvent, waitFor } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import { LocalSettingsFactory } from '@/test-utils/factories/LocalSettingsFactory';

describe('SyncServerForm', () => {
  const { getDataSource: _getDataSource } = setupTestDatabase();
  const factory = new LocalSettingsFactory();

  // We need to spy on initialize sync so that we don't actually call it during tests.
  const getDataSource = (): {
    dataSource: DataSource;
    initializeSyncSpy: jest.SpyInstance;
    cancelSyncSpy?: jest.SpyInstance;
  } => {
    const dataSource = _getDataSource();
    const initializeSyncSpy = jest.spyOn(dataSource, 'initializeSync').mockResolvedValue(undefined);
    const cancelSyncSpy = jest.spyOn(dataSource, 'cancelSync');
    return { dataSource, initializeSyncSpy, cancelSyncSpy };
  };

  it('Does not call initializeSync in test', async () => {
    const { dataSource, initializeSyncSpy } = getDataSource();

    renderWithDataSource(<SyncServerForm />, dataSource);

    expect(initializeSyncSpy).toHaveBeenCalledTimes(1);
  });

  it('Renders form with values from local settings', async () => {
    const { dataSource } = getDataSource();

    const localSettings = factory.create({
      syncServerUrl: 'https://example.com',
      syncServerAccessToken: 'test-token',
    });
    await dataSource.setLocalSettings(localSettings);

    renderWithDataSource(<SyncServerForm />, dataSource);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /server url/i })).toHaveValue(
        'https://example.com'
      );
      expect(screen.getByRole('textbox', { name: /access token/i })).toHaveValue('test-token');
    });
  });

  it('Validates URL and access token', async () => {
    const { dataSource } = getDataSource();
    renderWithDataSource(<SyncServerForm />, dataSource);

    const serverUrlInput = screen.getByRole('textbox', { name: /server url/i });
    const submitButton = screen.getByRole('button', { name: /log in/i });

    // Invalid URL
    await userEvent.click(serverUrlInput);
    await userEvent.type(serverUrlInput, 'invalid-url');

    await userEvent.click(submitButton);

    expect(screen.getByText(/server url is required/i)).toBeInTheDocument();
    expect(screen.getByText(/access token is required/i)).toBeInTheDocument();
  });

  it('Updates local settings on form submission', async () => {
    const { dataSource, initializeSyncSpy } = getDataSource();
    renderWithDataSource(<SyncServerForm />, dataSource);

    const serverUrlInput = screen.getByRole('textbox', { name: /server url/i });
    const accessTokenInput = screen.getByRole('textbox', { name: /access token/i });
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await userEvent.click(serverUrlInput);
    await userEvent.type(serverUrlInput, 'http://foo.local/myDb');
    await userEvent.click(accessTokenInput);
    await userEvent.type(accessTokenInput, 'my-access-token');

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Sync server settings updated successfully/i)).toBeInTheDocument();
    });

    const results = await dataSource.getLocalSettings();

    expect(results).toEqual(
      expect.objectContaining({
        syncServerUrl: 'http://foo.local/myDb',
        syncServerAccessToken: 'my-access-token',
      })
    );

    expect(initializeSyncSpy).toHaveBeenCalledTimes(2);
  });

  it('Handles errors when loading local settings', async () => {
    const { dataSource } = getDataSource();
    jest
      .spyOn(dataSource, 'getLocalSettings')
      .mockRejectedValue(new Error('Failed to load settings'));

    renderWithDataSource(<SyncServerForm />, dataSource);

    await waitFor(() => {
      expect(screen.getByText(/failed to load sync server settings/i)).toBeInTheDocument();
    });
  });

  it('Handles errors when updating local settings', async () => {
    const { dataSource } = getDataSource();
    jest
      .spyOn(dataSource, 'setLocalSettings')
      .mockRejectedValue(new Error('Failed to update settings'));

    renderWithDataSource(<SyncServerForm />, dataSource);

    const serverUrlInput = screen.getByRole('textbox', { name: /server url/i });
    const accessTokenInput = screen.getByRole('textbox', { name: /access token/i });
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await userEvent.click(serverUrlInput);
    await userEvent.type(serverUrlInput, 'http://foo.local/myDb');
    await userEvent.click(accessTokenInput);
    await userEvent.type(accessTokenInput, 'my-access-token');

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update sync server settings/i)).toBeInTheDocument();
    });
  });

  it('Initializes sync when form is submitted with values', async () => {
    const { dataSource, initializeSyncSpy } = getDataSource();
    renderWithDataSource(<SyncServerForm />, dataSource);

    // This happens in the context
    expect(initializeSyncSpy).toHaveBeenCalledTimes(1);

    const serverUrlInput = screen.getByRole('textbox', { name: /server url/i });
    const accessTokenInput = screen.getByRole('textbox', { name: /access token/i });
    const submitButton = screen.getByRole('button', { name: /log in/i });

    await userEvent.click(serverUrlInput);
    await userEvent.type(serverUrlInput, 'http://foo.local/myDb');
    await userEvent.click(accessTokenInput);
    await userEvent.type(accessTokenInput, 'my-access-token');

    await userEvent.click(submitButton);

    // And now it happens again!
    expect(initializeSyncSpy).toHaveBeenCalledTimes(2);
  });

  it('Disables the logout button when form is empty', async () => {
    const { dataSource } = getDataSource();
    renderWithDataSource(<SyncServerForm />, dataSource);

    const logoutButton = screen.getByRole('button', { name: /log out/i });

    expect(logoutButton).toBeDisabled();
  });

  it('Calls cancel sync when logout button is clicked', async () => {
    const { dataSource, cancelSyncSpy } = getDataSource();
    const localSettings = factory.create({
      syncServerUrl: 'https://example.com',
      syncServerAccessToken: 'test-token',
    });
    await dataSource.setLocalSettings(localSettings);

    renderWithDataSource(<SyncServerForm />, dataSource);
    const logoutButton = screen.getByRole('button', { name: /log out/i });

    await userEvent.click(logoutButton);

    // Check that initializeSync was called again (indicating a sync cancellation)
    await waitFor(() => {
      expect(cancelSyncSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('Clears sync server settings when logout button is clicked', async () => {
    const { dataSource } = getDataSource();
    const localSettings = factory.create({
      syncServerUrl: 'https://example.com',
      syncServerAccessToken: 'test-token',
    });

    const setLocalSettingsSpy = jest.spyOn(dataSource, 'setLocalSettings');
    const getLocalSettingsSpy = jest
      .spyOn(dataSource, 'getLocalSettings')
      .mockResolvedValue(localSettings);

    renderWithDataSource(<SyncServerForm />, dataSource);

    const logoutButton = screen.getByRole('button', { name: /log out/i });

    await userEvent.click(logoutButton);

    await waitFor(() => {
      expect(getLocalSettingsSpy).toHaveBeenCalled();
      expect(setLocalSettingsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          syncServerUrl: '',
          syncServerAccessToken: '',
        })
      );
    });
  });
});
