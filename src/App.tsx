import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';
import '@mantine/charts/styles.css';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import UpdateApplicationPrompt from '@/components/Common/UpdateApplicationPrompt';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { BulkOperationOverlayProvider } from './contexts/BulkOperationOverlayContext';
import { Router } from './Router';
import { theme } from './theme';

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <BulkOperationOverlayProvider>
          <Notifications />
          <DataSourceContextProvider>
            <Router />
          </DataSourceContextProvider>
        </BulkOperationOverlayProvider>
        <UpdateApplicationPrompt />
      </ModalsProvider>
    </MantineProvider>
  );
}
