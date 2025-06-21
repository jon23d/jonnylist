import React, { ReactElement } from 'react';
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
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { BulkOperationOverlayProvider } from '@/contexts/BulkOperationOverlayContext';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { DataSource } from '@/data/DataSource';
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
      Notifications: Notifications.extend({
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
      <MantineProvider theme={testTheme} env="test">
        <ModalsProvider>
          <BulkOperationOverlayProvider>
            <Notifications />
            {children}
          </BulkOperationOverlayProvider>
        </ModalsProvider>
      </MantineProvider>
    ),
  });
}

export function renderWithDatasource(component: ReactElement, dataSource: DataSource) {
  return render(
    <DataSourceContextProvider dataSource={dataSource}>{component}</DataSourceContextProvider>
  );
}
