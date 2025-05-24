import React from 'react';
import { Box } from '@mantine/core';

export default function ContextLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Box>Board | List | Card</Box>
      <Box>All | Project | Tag</Box>
      <>{children}</>
    </>
  );
}
