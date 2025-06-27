import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { renderWithDataSource } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';
import { useDataSource, useIsMigrating } from '../DataSourceContext';

const TestComponent = () => {
  const dataSource = useDataSource();
  const isMigrating = useIsMigrating();
  return (
    <div>
      <div data-testid="is-migrating">{isMigrating.toString()}</div>
      <div data-testid="version">{dataSource.getVersion()}</div>
    </div>
  );
};

describe('DataSourceContext', () => {
  const { getDataSource } = setupTestDatabase();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows migration status when migrations are running', async () => {
    const dataSource = getDataSource();
    // Mock the runMigrations method to simulate a migration
    jest.spyOn(dataSource, 'runMigrations').mockImplementation(async () => {
      if (dataSource.onMigrationStatusChange) {
        dataSource.onMigrationStatusChange(true);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (dataSource.onMigrationStatusChange) {
        dataSource.onMigrationStatusChange(false);
      }
    });

    renderWithDataSource(<TestComponent />, dataSource);

    // Wait for the useEffect to run and migrations to start
    await waitFor(() => {
      expect(screen.getByTestId('is-migrating')).toHaveTextContent('true');
    });

    // Wait for migrations to complete
    await waitFor(() => {
      expect(screen.getByTestId('is-migrating')).toHaveTextContent('false');
    });
  });

  it('does not show migration status when no migrations are needed', async () => {
    const dataSource = getDataSource();

    // Mock needsMigration to return false
    jest.spyOn(dataSource, 'runMigrations').mockImplementation(async () => {
      // Do nothing - no migrations needed
    });

    renderWithDataSource(<TestComponent />, dataSource);

    // Should remain false throughout
    await waitFor(() => {
      expect(screen.getByTestId('is-migrating')).toHaveTextContent('false');
    });
  });

  it('throws error when useDataSource is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useDataSource must be used within a DataSourceContextProvider');

    consoleError.mockRestore();
  });

  it('throws error when useIsMigrating is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const TestComponentWithoutProvider = () => {
      const isMigrating = useIsMigrating();
      return <div data-testid="is-migrating">{isMigrating.toString()}</div>;
    };

    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useIsMigrating must be used within a DataSourceContextProvider');

    consoleError.mockRestore();
  });

  it('uses provided dataSource instead of creating new one', () => {
    const dataSource = getDataSource();
    const getVersionSpy = jest.spyOn(dataSource, 'getVersion').mockReturnValue(999);

    renderWithDataSource(<TestComponent />, dataSource);

    expect(screen.getByTestId('version')).toHaveTextContent('999');

    getVersionSpy.mockRestore();
  });

  it('Calls initialize sync on data source', async () => {
    const dataSource = getDataSource();
    const initializeSyncSpy = jest.spyOn(dataSource, 'initializeSync').mockResolvedValue();

    renderWithDataSource(<TestComponent />, dataSource);

    // Ensure initializeSync was called
    expect(initializeSyncSpy).toHaveBeenCalled();
  });
});
