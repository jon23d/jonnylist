import React from 'react';
import Link from 'next/link';
import { AppShell, Burger, Group, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          JonnyList
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        Contexts
        <NavLink href="/contexts/home" component={Link} label="Home" />
        <NavLink href="/contexts/work" component={Link} label="Work" />
        <NavLink href="/contexts/grocery-store" component={Link} label="Grocery store" />
        Reports
        <NavLink href="/reports/weekly" component={Link} label="Weekly" />
        <NavLink href="/reports/monthly" component={Link} label="Monthly" />
        <NavLink href="/reports/projects" component={Link} label="Projects" />
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
