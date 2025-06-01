import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { MantineProvider } from '@mantine/core';
import Layout from '@/components/Layout/Layout';
import { DataSourceContextProvider } from '@/contexts/DataSourceContext';
import { theme } from '@/theme';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider theme={theme}>
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
    </MantineProvider>
  );
}
