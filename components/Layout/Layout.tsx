import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  IconClipboardListFilled,
  IconManualGearboxFilled,
  IconSettingsFilled,
} from '@tabler/icons-react';
import {
  Anchor,
  AppShell,
  Box,
  Burger,
  Center,
  Group,
  NavLink,
  ScrollArea,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ContextLinks from '@/components/Layout/ContextLinks';
import Footer from '@/components/Layout/Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter();
  const query = router.query;

  const listLinks = ['grocery-store', 'hardware-store'].map((list) => (
    <NavLink
      key={list}
      href={`/lists/?list=${list}`}
      label={list}
      component={Link}
      active={query?.list === list}
      pl={40}
    />
  ));

  return (
    <AppShell
      header={{ height: 30 }}
      navbar={{ width: 225, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      footer={{ height: 40 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" bg="blue.1" wrap="nowrap" align="center" justify="space-between">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text size="xs" fw={800} c="black" ml={{ xs: 0, sm: 60 }}>
            &#123; JonnyList &#125;
          </Text>
          <Text size="xs" c="gray.6">
            <Anchor href="#">4 tasks due today</Anchor> /{' '}
            <Anchor href="#">12 tasks in progress</Anchor> /{' '}
            <Anchor href="#">3 open projects</Anchor>
          </Text>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section grow my="md" component={ScrollArea}>
          <NavLink
            href="/contexts"
            component={Link}
            label="Contexts"
            active={router.pathname === '/contexts' && !query?.context}
            leftSection={<IconManualGearboxFilled />}
          />
          <ContextLinks />
          <NavLink
            href="/lists"
            component={Link}
            label="Lists"
            active={router.pathname === '/lists' && !query?.list}
            leftSection={<IconClipboardListFilled />}
          />
          {listLinks}
        </AppShell.Section>
        <AppShell.Section>
          <NavLink
            href="/settings"
            component={Link}
            label="Settings"
            active={router.pathname === '/settings'}
            leftSection={<IconSettingsFilled />}
          />
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
      <AppShell.Footer p="xs" bg="blue.1">
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
