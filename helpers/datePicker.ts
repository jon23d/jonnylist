import dayjs from 'dayjs';

export const datePickerPresets = [
  { value: dayjs().add(1, 'day').format('YYYY-MM-DD'), label: '+1 day' },
  { value: dayjs().add(3, 'day').format('YYYY-MM-DD'), label: '+3 days' },
  { value: dayjs().add(7, 'day').format('YYYY-MM-DD'), label: '+7 days' },
  { value: dayjs().add(14, 'day').format('YYYY-MM-DD'), label: '+14 days' },
  { value: dayjs().add(21, 'day').format('YYYY-MM-DD'), label: '+21 days' },
  { value: dayjs().add(1, 'month').format('YYYY-MM-DD'), label: 'Next month' },
];
