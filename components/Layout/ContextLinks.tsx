import React from 'react';
import { useRouter } from 'next/router';
import { IconManualGearboxFilled } from '@tabler/icons-react';
import { NavLink } from '@mantine/core';

export default function ContextLinks({
  handleNavLinkClick,
}: {
  handleNavLinkClick: (url: string) => void;
}) {
  const router = useRouter();

  const links = [
    <NavLink
      key="None"
      onClick={() => handleNavLinkClick(`/tasks`)}
      label="None"
      active={router.pathname === '/tasks'}
      pl={40}
      data-testid="context-link-none"
    />,
  ];

  return (
    <>
      <NavLink href="#" label="Contexts" leftSection={<IconManualGearboxFilled />} />
      {links}
    </>
  );
}
