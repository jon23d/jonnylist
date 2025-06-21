import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import Layout from '@/components/Layout/Layout';
import { BulkOperationOverlayProvider } from '@/contexts/BulkOperationOverlayContext';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { theme } from '@/theme';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <BulkOperationOverlayProvider>
          <Notifications />
          <DataSourceContextProvider>
            <Head>
              <title>JonnyList</title>
              <meta
                name="viewport"
                content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
              />
              <link rel="shortcut icon" href="/favicon.svg" />
            </Head>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </DataSourceContextProvider>
        </BulkOperationOverlayProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}
