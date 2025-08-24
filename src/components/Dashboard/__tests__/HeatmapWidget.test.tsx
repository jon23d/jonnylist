import { vi } from 'vitest';
import { Heatmap } from '@mantine/charts';
import HeatmapWidget from '@/components/Dashboard/HeatmapWidget';
import { TaskStatus } from '@/data/documentTypes/Task';
import { taskFactory } from '@/test-utils/factories/TaskFactory';
import { render, screen } from '@/test-utils/index';

vi.mock('@mantine/charts', () => {
  return {
    Heatmap: vi.fn(),
  };
});

describe('HeatmapWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Renders a heatmap with three months of data', async () => {
    vi.setSystemTime(new Date('2024-03-01T12:00:00Z'));
    const tasks = [
      // Mixing the dates to ensure the component aggregates correctly
      taskFactory({ completedAt: new Date('2024-01-01T12:00:00Z'), status: TaskStatus.Done }),
      taskFactory({ completedAt: new Date('2024-01-02T12:00:00Z'), status: TaskStatus.Done }),
      taskFactory({ completedAt: new Date('2024-01-01T12:00:00Z'), status: TaskStatus.Done }),
    ];

    render(<HeatmapWidget completedTasks={tasks} />);

    expect(Heatmap).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          '2024-01-01': 2,
          '2024-01-02': 1,
        },
        startDate: '2023-12-01',
      }),
      undefined
    );
  });

  it('Does not render a heatmap if no completed tasks are provided', async () => {
    render(<HeatmapWidget />);

    expect(Heatmap).not.toHaveBeenCalled();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
