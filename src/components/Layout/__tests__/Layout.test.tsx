import React from 'react';
import Layout from '@/components/Layout/Layout';
import { setupTestDatabase } from '@/test-utils/db';
import { act, renderWithDataSource, screen } from '@/test-utils/index';

vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn().mockReturnValue({ pathname: '/' }),
    useNavigate: vi.fn().mockReturnValue(() => {}),
    Outlet: () => <div data-testid="page-content">Page Content</div>,
    useMatches: vi.fn().mockReturnValue([{ handle: { title: 'Test Title' } }]),
  };
});

// Mock the child components to avoid complex rendering
vi.mock('@/components/Layout/ContextLinks', () => ({
  default: () => <div data-testid="context-links">Context Links</div>,
}));

vi.mock('@/components/Layout/DataMigrationOverlay', () => ({
  default: () => <div data-testid="migration-overlay">Migration in progress...</div>,
}));

vi.mock('@/components/Layout/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

vi.mock('@/components/Layout/HeaderLinks', () => ({
  default: () => <div data-testid="header-links">Header Links</div>,
}));

vi.mock('@/components/Layout/CommandPalette', () => ({
  default: () => null,
}));

describe('Layout', () => {
  const { getDataSource } = setupTestDatabase();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
  });

  it('Shows the data migration overlay for at least 2 seconds when migrating', async () => {
    const dataSource = getDataSource();

    let migrationCallback: ((status: boolean) => void) | undefined;

    // Mock runMigrations to simulate a quick migration (less than 2 seconds)
    vi.spyOn(dataSource, 'runMigrations').mockImplementation(async () => {
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

    renderWithDataSource(<Layout />, dataSource);

    expect(screen.getByTestId('migration-overlay')).toBeInTheDocument();

    // Fast-forward 1.5 seconds (migration completes)
    act(() => vi.advanceTimersByTime(1500));

    // Overlay should still be visible (minimum 2 seconds not reached)
    expect(screen.getByTestId('migration-overlay')).toBeInTheDocument();

    // Fast-forward to 3 seconds total
    act(() => vi.advanceTimersByTime(3000));

    // Now overlay should be hidden
    expect(screen.queryByTestId('migration-overlay')).not.toBeInTheDocument();
  });

  it('Hides the data migration overlay when migration is complete', async () => {
    const dataSource = getDataSource();

    let migrationCallback: ((status: boolean) => void) | undefined;

    // Mock runMigrations to simulate a long migration (more than 4 seconds)
    vi.spyOn(dataSource, 'runMigrations').mockImplementation(async () => {
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

    renderWithDataSource(<Layout />, dataSource);

    // Wait for migration to start
    expect(screen.getByTestId('migration-overlay')).toBeInTheDocument();

    // Fast-forward 5 seconds (migration completes after minimum time)
    act(() => vi.advanceTimersByTime(5000));

    // Overlay should be hidden immediately since minimum time has passed
    expect(screen.queryByTestId('migration-overlay')).not.toBeInTheDocument();
  });

  it('Does not show the data migration overlay when not migrating', async () => {
    const dataSource = getDataSource();
    // Mock runMigrations to not trigger any migration
    vi.spyOn(dataSource, 'runMigrations').mockImplementation(async () => {
      // No migration status change - migration is not needed
    });

    renderWithDataSource(<Layout />, dataSource);

    expect(screen.getByTestId('page-content')).toBeInTheDocument();

    // Migration overlay should not be present
    expect(screen.queryByTestId('migration-overlay')).not.toBeInTheDocument();

    // Verify page content is visible
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('header-links')).toBeInTheDocument();
  });

  it('handles migration status changes correctly', async () => {
    const dataSource = getDataSource();

    let migrationCallback: ((status: boolean) => void) | undefined;

    vi.spyOn(dataSource, 'runMigrations').mockImplementation(async () => {
      migrationCallback = dataSource.onMigrationStatusChange;
    });

    renderWithDataSource(<Layout />, dataSource);

    // Initially no overlay
    expect(screen.queryByTestId('migration-overlay')).not.toBeInTheDocument();

    // Manually trigger migration start
    act(() => {
      if (migrationCallback) {
        migrationCallback(true);
      }
    });

    // Overlay should appear
    expect(screen.getByTestId('migration-overlay')).toBeInTheDocument();

    // Fast-forward 1 seconds and stop migration
    act(() => {
      vi.advanceTimersByTime(1000);
      if (migrationCallback) {
        migrationCallback(false);
      }
    });

    // Overlay should still be visible (minimum time not reached)
    expect(screen.getByTestId('migration-overlay')).toBeInTheDocument();

    // Fast-forward remaining time to reach 4 seconds
    act(() => vi.advanceTimersByTime(2500));

    // Now overlay should be hidden
    expect(screen.queryByTestId('migration-overlay')).not.toBeInTheDocument();
  });
});
