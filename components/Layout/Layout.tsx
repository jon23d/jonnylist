import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  IconClipboardListFilled,
  IconManualGearboxFilled,
  IconSettingsFilled,
} from '@tabler/icons-react';
import { AppShell, Burger, Group, NavLink, ScrollArea } from '@mantine/core';
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
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      footer={{ height: 40 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          JonnyList
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
      <AppShell.Footer p="xs">
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
