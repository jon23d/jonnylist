import React from 'react';
import { render as testingLibraryRender } from '@testing-library/react';
import {
  createTheme,
  MantineProvider,
  Menu,
  mergeThemeOverrides,
  Modal,
  Popover,
  SegmentedControl,
} from '@mantine/core';
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
      Menu: Menu.extend({
        defaultProps: {
          transitionProps: {
            duration: 0,
          },
        },
      }),
      Modal: Modal.extend({
        defaultProps: {
          transitionProps: {
            duration: 0,
          },
        },
      }),
      Popover: Popover.extend({
        defaultProps: {
          hideDetached: false,
        },
      }),
    },
  })
);

export function render(ui: React.ReactNode) {
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider theme={testTheme} env="test">
        {children}
      </MantineProvider>
    ),
  });
}
