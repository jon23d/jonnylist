import React from 'react';
import { useRouter } from 'next/router';
import { IconSettingsFilled } from '@tabler/icons-react';
import { AppShell, Burger, Group, NavLink, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ContextLinks from '@/components/Layout/ContextLinks';
import Footer from '@/components/Layout/Footer';
import HeaderLinks from '@/components/Layout/HeaderLinks';
import ListLinks from '@/components/Layout/ListLinks';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter();

  const handleNavLinkClick = async (url: string) => {
    await router.push(url);
    if (opened) {
      toggle();
    }
  };

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
      <AppShell.Footer p="xs" bg="blue.1">
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
