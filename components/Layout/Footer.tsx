import React from 'react';
import Link from 'next/link';
import { Anchor, Text } from '@mantine/core';

export default function Footer() {
  return (
    <Text size="sm" ta="center" c="gray">
      <Anchor href="https://github.com/jon23d/jonnylist" component={Link}>
        JonnyList
      </Anchor>{' '}
      © 2025 by{' '}
      <Anchor href="https://www.linkedin.com/in/jon23d/" component={Link}>
        Jonathon Deason
      </Anchor>{' '}
      is licensed under{' '}
      <Anchor href="https://creativecommons.org/licenses/by-nc-sa/4.0/" component={Link}>
        CC BY-NC-SA 4.0
      </Anchor>
    </Text>
  );
}
