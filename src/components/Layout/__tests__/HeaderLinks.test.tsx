import HeaderLinks from '@/components/Layout/HeaderLinks';
import * as DataSourceContext from '@/contexts/DataSourceContext';
import { SyncStatus } from '@/data/DataSource';
import { setupTestDatabase } from '@/test-utils/db';
import { renderWithDataSource, screen, userEvent, waitFor } from '@/test-utils/index';

vi.mock('@/components/Layout/NewItem/AddNewItemButton', () => ({
  __esModule: true,
  default: () => <div>Add new item</div>,
}));

describe('HeaderLinks', () => {
  const { getDataSource } = setupTestDatabase();

  it('Includes the AddNewItemButton component', async () => {
    renderWithDataSource(<HeaderLinks />, getDataSource());

    await waitFor(() => expect(screen.getByText('Add new item')).toBeInTheDocument());
  });

  describe('SyncStatusIndicator', () => {
    it('should not render the indicator when sync status is INACTIVE', () => {
      vi.spyOn(DataSourceContext, 'useSyncStatus').mockReturnValue(SyncStatus.INACTIVE);
      renderWithDataSource(<HeaderLinks />, getDataSource());
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should render a green dot for ACTIVE status', async () => {
      vi.spyOn(DataSourceContext, 'useSyncStatus').mockReturnValue(SyncStatus.ACTIVE);
      const { container } = renderWithDataSource(<HeaderLinks />, getDataSource());

      const indicator = container.querySelector('div[style*="background-color: green"]');
      expect(indicator).toBeInTheDocument();

      await userEvent.hover(indicator!);
      expect(await screen.findByText('Sync active')).toBeInTheDocument();
    });

    it('should render a green dot for PAUSED status', async () => {
      vi.spyOn(DataSourceContext, 'useSyncStatus').mockReturnValue(SyncStatus.PAUSED);
      const { container } = renderWithDataSource(<HeaderLinks />, getDataSource());

      const indicator = container.querySelector('div[style*="background-color: green"]');
      expect(indicator).toBeInTheDocument();

      await userEvent.hover(indicator!);
      expect(await screen.findByText('Sync active')).toBeInTheDocument();
    });

    it('should render a red dot for ERROR status', async () => {
      vi.spyOn(DataSourceContext, 'useSyncStatus').mockReturnValue(SyncStatus.ERROR);
      const { container } = renderWithDataSource(<HeaderLinks />, getDataSource());

      const indicator = container.querySelector('div[style*="background-color: red"]');
      expect(indicator).toBeInTheDocument();

      await userEvent.hover(indicator!);
      expect(await screen.findByText('Sync error')).toBeInTheDocument();
    });
  });
});
