import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconSettingsFilled } from '@tabler/icons-react';
import { AppShell, Burger, Group, NavLink, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import BulkOperationOverlay from '@/components/Common/BulkOperationOverlay';
import ContextLinks from '@/components/Layout/ContextLinks';
import DataMigrationOverlay from '@/components/Layout/DataMigrationOverlay';
import Footer from '@/components/Layout/Footer';
import HeaderLinks from '@/components/Layout/HeaderLinks';
import ListLinks from '@/components/Layout/ListLinks';
import { useBulkOperationOverlay } from '@/contexts/BulkOperationOverlayContext';
import { useIsMigrating } from '@/contexts/DataSourceContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const { opened: bulkOverlayOpened, config: bulkOverlayConfig } = useBulkOperationOverlay();
  const router = useRouter();
  const isMigrating = useIsMigrating();
  const [showOverlay, setShowOverlay] = useState(false);
  const [migrationStartTime, setMigrationStartTime] = useState<number | null>(null);

  useEffect(() => {
    // We want to avoid flashing the overlay when the migration is complete, so
    // we have a minimum time that the overlay is shown for.
    if (isMigrating) {
      setMigrationStartTime(Date.now());
      setShowOverlay(true);
    } else if (migrationStartTime) {
      const elapsedTime = Date.now() - migrationStartTime;
      const remainingTime = Math.max(0, 4000 - elapsedTime);

      if (remainingTime > 0) {
        const timer = setTimeout(() => setShowOverlay(false), remainingTime);
        return () => clearTimeout(timer);
      }

      setShowOverlay(false);
    }
  }, [isMigrating]);

  const handleNavLinkClick = async (url: string) => {
    await router.push(url);
    if (opened) {
      toggle();
    }
  };

  return (
    <>
      {showOverlay && <DataMigrationOverlay />}
      <AppShell
        header={{ height: 30 }}
        navbar={{ width: 225, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        footer={{ height: 40 }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" bg="blue.0" wrap="nowrap" align="center" justify="space-between">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <HeaderLinks />
          </Group>
        </AppShell.Header>
        <AppShell.Navbar p="md">
          <AppShell.Section grow my="md" component={ScrollArea}>
            <ContextLinks handleNavLinkClick={handleNavLinkClick} />
            <ListLinks handleNavLinkClick={handleNavLinkClick} />
          </AppShell.Section>
          <AppShell.Section>
            <NavLink
              onClick={() => handleNavLinkClick('/settings')}
              label="Settings"
              active={router.pathname === '/settings'}
              leftSection={<IconSettingsFilled />}
            />
          </AppShell.Section>
        </AppShell.Navbar>
        <AppShell.Main>{children}</AppShell.Main>
        <AppShell.Footer p="xs" bg="blue.0">
          <Footer />
        </AppShell.Footer>
      </AppShell>
      {bulkOverlayOpened && (
        <BulkOperationOverlay
          title={bulkOverlayConfig.title}
          description={bulkOverlayConfig.description}
        />
      )}
    </>
  );
}
