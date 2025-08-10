import React from 'react';
import { Card, Center, Image, Overlay, Text } from '@mantine/core';

export default function BulkOperationOverlay({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Overlay fixed blur={5} backgroundOpacity={0.6} h="100vh" w="100vw" zIndex={10000}>
      <Center h="100%">
        <Card shadow="md" padding="lg" radius="md" withBorder w="400px">
          <Card.Section>
            <Image src="/migrations.png" height={300} alt="Data migrating" />
          </Card.Section>

          <Text fw={500} mt={20} mb={20} ta="center">
            {title}
          </Text>

          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </Card>
      </Center>
    </Overlay>
  );
}
