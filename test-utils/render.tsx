import React from 'react';
import { render as testingLibraryRender } from '@testing-library/react';
import { createTheme, MantineProvider, mergeThemeOverrides, SegmentedControl } from '@mantine/core';
import { theme } from '@/theme';

const testTheme = mergeThemeOverrides(
  theme,
  createTheme({
    components: {
      SegmentedControl: SegmentedControl.extend({
        defaultProps: {
          transitionDuration: 0,
        },
      }),
    },
  })
);

export function render(ui: React.ReactNode) {
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider theme={testTheme}>{children}</MantineProvider>
    ),
  });
}
