import React from 'react';
import { Anchor, Text } from '@mantine/core';
import { DATABASE_VERSION } from '@/data/migrations/versions/Versions';

export default function Footer() {
  return (
    <Text size="xs" ta="center" c="gray">
      <Anchor href="https://github.com/jon23d/jonnylist" mr="0.5em">
        JonnyList 2.0.2
      </Anchor>
      © 2025 by
      <Anchor href="https://www.linkedin.com/in/jon23d/" ml="0.5em">
        Jonathon Deason
      </Anchor>
      <Text span visibleFrom="xs" ml="0.5em">
        is licensed under
        <Anchor href="https://creativecommons.org/licenses/by-nc-sa/4.0/" ml="0.5em">
          CC BY-NC-SA 4.0
        </Anchor>
      </Text>
      <Text span visibleFrom="xs" ml="1em">
        DB version {DATABASE_VERSION}
      </Text>
    </Text>
  );
}
