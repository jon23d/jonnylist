import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { IconCalendarCheck } from '@tabler/icons-react';
import { Heatmap } from '@mantine/charts';
import { Center, Paper, Text, useMatches } from '@mantine/core';
import WidgetTitle from '@/components/Dashboard/WidgetTitle';
import { Task } from '@/data/documentTypes/Task';

export default function HeatmapWidget({ completedTasks }: { completedTasks?: Task[] }) {
  const [heatmapData, setHeatmapData] = useState<Record<string, number> | null>(null);

  const cellWidth = useMatches({
    base: 15,
    sm: 12,
    md: 13,
    lg: 14,
  });

  const cellSpacing = useMatches({
    base: 3,
    sm: 5,
    md: 3,
    lg: 2,
  });

  useEffect(() => {
    if (completedTasks === undefined) {
      return;
    }

    const startDate = dayjs().subtract(3, 'month');
    const endDate = dayjs();

    const filteredTasks = completedTasks.filter((task) => {
      if (!task.completedAt) {
        return false;
      }
      const completedAtDate = dayjs(task.completedAt);
      return completedAtDate.isAfter(startDate) && completedAtDate.isBefore(endDate);
    });

    const data: Record<string, number> = {};

    filteredTasks.forEach((task) => {
      if (task.completedAt) {
        const dateKey = dayjs(task.completedAt).format('YYYY-MM-DD');
        if (data[dateKey]) {
          data[dateKey] += 1;
        } else {
          data[dateKey] = 1;
        }
      }
    });

    setHeatmapData(data);
  }, [completedTasks]);

  const heatmapCellLabel = ({ date, value }: { date: string; value: number | null }) => {
    const dt = dayjs(date).format('DD MMM, YYYY');
    if (value === null || value === 0) {
      return `${dt} - Nothing completed`;
    }

    return `${dt} - ${value} task${value > 1 ? 's' : ''} completed`;
  };

  return (
    <Paper shadow="sm" radius="md" withBorder p="lg">
      <WidgetTitle title="3-Month Activity" icon={<IconCalendarCheck color="purple" size={18} />} />
      <Center>
        {(heatmapData && (
          <Heatmap
            gap={cellSpacing}
            rectRadius={5}
            rectSize={cellWidth}
            withTooltip
            withWeekdayLabels
            withMonthLabels
            getTooltipLabel={heatmapCellLabel}
            startDate={dayjs().subtract(3, 'month').format('YYYY-MM-DD')}
            data={heatmapData}
          />
        )) || <Text>Loading...</Text>}
      </Center>
    </Paper>
  );
}
