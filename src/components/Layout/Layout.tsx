import React, { useEffect, useState } from 'react';
import { IconSettingsFilled } from '@tabler/icons-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Anchor, AppShell, Burger, Flex, Group, NavLink, ScrollArea, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import BulkOperationOverlay from '@/components/Common/BulkOperationOverlay';
import CommandPalette from '@/components/Layout/CommandPalette';
import ContextLinks from '@/components/Layout/ContextLinks';
import DataMigrationOverlay from '@/components/Layout/DataMigrationOverlay';
import Footer from '@/components/Layout/Footer';
import HeaderLinks from '@/components/Layout/HeaderLinks';
import PageTitle from '@/components/Layout/PageTitle';
import ReportLinks from '@/components/Layout/ReportLinks';
import { useBulkOperationOverlay } from '@/contexts/BulkOperationOverlayContext';
import { useIsMigrating } from '@/contexts/DataSourceContext';

export default function Layout() {
  const [openedOnMobile, { toggle: toggleMobile }] = useDisclosure();
  const [openedOnDesktop, { toggle: toggleDesktop }] = useDisclosure(true);
  const { opened: bulkOverlayOpened, config: bulkOverlayConfig } = useBulkOperationOverlay();
  const navigate = useNavigate();
  const location = useLocation();

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
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      if (remainingTime > 0) {
        const timer = setTimeout(() => setShowOverlay(false), remainingTime);
        return () => clearTimeout(timer);
      }

      setShowOverlay(false);
    }
  }, [isMigrating]);

  const handleNavLinkClick = async (url: string) => {
    navigate(url);
    if (openedOnMobile) {
      toggleMobile();
    }
  };

  const headerBackgroundColor = process.env.NODE_ENV === 'development' ? 'yellow.0' : 'blue.0';

  return (
    <>
      <PageTitle />
      {showOverlay && <DataMigrationOverlay />}
      <AppShell
        header={{ height: 30 }}
        navbar={{
          width: 225,
          breakpoint: 'xs',
          collapsed: { mobile: !openedOnMobile, desktop: !openedOnDesktop },
        }}
        footer={{ height: 40 }}
        padding="md"
      >
        <AppShell.Header>
          <Group
            h="100%"
            px="md"
            bg={headerBackgroundColor}
            wrap="nowrap"
            align="center"
            justify="space-between"
          >
            <Flex justify="flex-start">
              <Burger opened={openedOnMobile} onClick={toggleMobile} size="sm" hiddenFrom="xs" />
              <Burger opened={openedOnDesktop} onClick={toggleDesktop} size="sm" visibleFrom="xs" />
              <Text size="xs" fw={800} c="black" visibleFrom="xs" mt={5} ml={10}>
                <Anchor to="/" component={Link}>
                  JonnyList
                </Anchor>
              </Text>
            </Flex>
            <HeaderLinks />
          </Group>
        </AppShell.Header>
        <AppShell.Navbar p="md">
          <AppShell.Section grow component={ScrollArea}>
            <ContextLinks handleNavLinkClick={handleNavLinkClick} />
            <ReportLinks handleNavLinkClick={handleNavLinkClick} />

            <CommandPalette />
          </AppShell.Section>
          <AppShell.Section>
            <NavLink
              onClick={() => handleNavLinkClick('/settings')}
              label="Settings"
              active={location.pathname === '/settings'}
              leftSection={<IconSettingsFilled />}
            />
          </AppShell.Section>
        </AppShell.Navbar>
        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
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
