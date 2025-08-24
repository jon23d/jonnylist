import React from 'react';
import { Box, Flex, Text } from '@mantine/core';

export default function WidgetTitle({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <Flex align="center" justify="center" mb={10}>
      <Box mr={10} mt={6}>
        {icon}
      </Box>
      <Text fw={700} c="blue.7">
        {title}
      </Text>
    </Flex>
  );
}
