import React from 'react';
import { useRouter } from 'next/router';
import CommandPalette from '@/components/Layout/CommandPalette';
import Layout from '@/components/Layout/Layout';
import { act, renderWithDataSource, screen, waitFor } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
const mockRouter = {
  pathname: '/',
  push: jest.fn(),
};

// Mock the child components to avoid complex rendering
jest.mock('@/components/Layout/ContextLinks', () => {
  return function ContextLinks() {
    return <div data-testid="context-links">Context Links</div>;
  };
});

jest.mock('@/components/Layout/DataMigrationOverlay', () => {
  return function DataMigrationOverlay() {
    return <div data-testid="migration-overlay">Migration in progress...</div>;
  };
});

jest.mock('@/components/Layout/Footer', () => {
  return function Footer() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock('@/components/Layout/HeaderLinks', () => {
  return function HeaderLinks() {
    return <div data-testid="header-links">Header Links</div>;
  };
});

jest.mock('@/components/Layout/CommandPalette');

describe('Layout', () => {
  const { getDataSource } = setupTestDatabase();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(async () => {
    jest.clearAllTimers();
  });

  it('Shows the data migration overlay for at least 4 seconds when migrating', async () => {
    const dataSource = getDataSource();
    jest.useFakeTimers();

    let migrationCallback: ((status: boolean) => void) | undefined;

    // Mock runMigrations to simulate a quick migration (less than 4 seconds)
    jest.spyOn(dataSource, 'runMigrations').mockImplementation(async () => {
      migrationCallback = dataSource.onMigrationStatusChange;
      if (migrationCallback) {
        migrationCallback(true); // Start migration

        // Simulate migration completing after 1 second
        setTimeout(() => {
          if (migrationCallback) {
            migrationCallback(false);
          }
        }, 1000);
      }
    });

    renderWithDataSource(
      <Layout>
        <div data-testid="page-content">Page Content</div>
      </Layout>,
      dataSource
    );

    // Wait for migration to start
    await waitFor(() => {
      expect(screen.getByTestId('migration-overlay')).toBeInTheDocument();
    });

    // Fast-forward 1.5 seconds (migration completes)
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    // Overlay should still be visible (minimum 4 seconds not reached)
    expect(screen.getByTestId('migration-overlay')).toBeInTheDocument();

    // Fast-forward to 3.9 seconds total
    act(() => {
      jest.advanceTimersByTime(2490);
    });

    // Overlay should still be visible
    expect(screen.getByTestId('migration-overlay')).toBeInTheDocument();

    // Fast-forward past 4 seconds total
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Now overlay should be hidden
    await waitFor(() => {
      expect(screen.queryByTestId('migration-overlay')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('Hides the data migration overlay when migration is complete', async () => {
    const dataSource = getDataSource();
    jest.useFakeTimers();

    let migrationCallback: ((status: boolean) => void) | undefined;

    // Mock runMigrations to simulate a long migration (more than 4 seconds)
    jest.spyOn(dataSource, 'runMigrations').mockImplementation(async () => {
      migrationCallback = dataSource.onMigrationStatusChange;
      if (migrationCallback) {
        migrationCallback(true); // Start migration

        // Simulate migration completing after 5 seconds
        setTimeout(() => {
          if (migrationCallback) {
            migrationCallback(false);
          }
        }, 5000);
      }
    });

    renderWithDataSource(
      <Layout>
        <div data-testid="page-content">Page Content</div>
      </Layout>,
      dataSource
    );

    // Wait for migration to start
    await waitFor(() => {
      expect(screen.getByTestId('migration-overlay')).toBeInTheDocument();
    });

    // Fast-forward 5 seconds (migration completes after minimum time)
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Overlay should be hidden immediately since minimum time has passed
    await waitFor(() => {
      expect(screen.queryByTestId('migration-overlay')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('Does not show the data migration overlay when not migrating', async () => {
    const dataSource = getDataSource();
    // Mock runMigrations to not trigger any migration
    jest.spyOn(dataSource, 'runMigrations').mockImplementation(async () => {
      // No migration status change - migration is not needed
    });

    renderWithDataSource(
      <Layout>
        <div data-testid="page-content">Page Content</div>
      </Layout>,
      dataSource
    );

    // Wait a moment for any effects to run
    await waitFor(() => {
      expect(screen.getByTestId('page-content')).toBeInTheDocument();
    });

    // Migration overlay should not be present
    expect(screen.queryByTestId('migration-overlay')).not.toBeInTheDocument();

    // Verify page content is visible
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('header-links')).toBeInTheDocument();
  });

  it('handles migration status changes correctly', async () => {
    const dataSource = getDataSource();
    jest.useFakeTimers();

    let migrationCallback: ((status: boolean) => void) | undefined;

    jest.spyOn(dataSource, 'runMigrations').mockImplementation(async () => {
      migrationCallback = dataSource.onMigrationStatusChange;
    });

    renderWithDataSource(
      <Layout>
        <div data-testid="page-content">Page Content</div>
      </Layout>,
      dataSource
    );

    // Initially no overlay
    expect(screen.queryByTestId('migration-overlay')).not.toBeInTheDocument();

    // Manually trigger migration start
    act(() => {
      if (migrationCallback) {
        migrationCallback(true);
      }
    });

    // Overlay should appear
    await waitFor(() => {
      expect(screen.getByTestId('migration-overlay')).toBeInTheDocument();
    });

    // Fast-forward 2 seconds and stop migration
    act(() => {
      jest.advanceTimersByTime(2000);
      if (migrationCallback) {
        migrationCallback(false);
      }
    });

    // Overlay should still be visible (minimum time not reached)
    expect(screen.getByTestId('migration-overlay')).toBeInTheDocument();

    // Fast-forward remaining time to reach 4 seconds
    act(() => {
      jest.advanceTimersByTime(2500);
    });

    // Now overlay should be hidden
    await waitFor(() => {
      expect(screen.queryByTestId('migration-overlay')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('Renders the command palette', async () => {
    const dataSource = getDataSource();
    (CommandPalette as jest.Mock).mockImplementation(() => jest.fn());

    renderWithDataSource(
      <Layout>
        <div data-testid="page-content">Page Content</div>
      </Layout>,
      dataSource
    );

    // Check if the command palette is rendered
    expect(CommandPalette).toHaveBeenCalled();
  });
});
