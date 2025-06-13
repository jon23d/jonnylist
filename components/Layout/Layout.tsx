import React from 'react';
import { useRouter } from 'next/router';
import { IconSettingsFilled } from '@tabler/icons-react';
import {
  AppShell,
  Badge,
  Burger,
  Card,
  Center,
  Group,
  Image,
  NavLink,
  Overlay,
  ScrollArea,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import ContextLinks from '@/components/Layout/ContextLinks';
import Footer from '@/components/Layout/Footer';
import HeaderLinks from '@/components/Layout/HeaderLinks';
import ListLinks from '@/components/Layout/ListLinks';
import { DATABASE_VERSION } from '@/data/DataSource';

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
    <>
      <Overlay fixed blur={5} backgroundOpacity={0.25} h="100%">
        <Center h="100%">
          <Card shadow="sm" padding="lg" radius="md" withBorder w="400px">
            <Card.Section>
              <Image src="/migrations.png" height={300} alt="Data migrating" />
            </Card.Section>

            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={500}>Data Migration</Text>
              <Badge color="green">Upgrading to version {DATABASE_VERSION}</Badge>
            </Group>

            <Text size="sm" c="dimmed">
              Hold tight! We are migrating your data to the latest version. This may take a few
              moments.
            </Text>
          </Card>
        </Center>
      </Overlay>
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
    </>
  );
}
