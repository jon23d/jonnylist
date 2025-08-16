import React from 'react';
import { Badge, Card, Center, Group, Image, Overlay, Text } from '@mantine/core';
import { DATABASE_VERSION } from '@/data/migrations/versions/Versions';

export default function DataMigrationOverlay() {
  return (
    <Overlay fixed blur={5} backgroundOpacity={0.25} h="100%">
      <Center h="100%">
        <Card shadow="md" padding="lg" radius="md" withBorder w="400px">
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
  );
}
