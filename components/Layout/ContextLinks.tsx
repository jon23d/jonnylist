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
  const query = router.query;

  const links = [
    <NavLink
      key="None"
      onClick={() => handleNavLinkClick(`/contexts/view?name=None`)}
      label="None"
      active={query?.name === 'None' && router.pathname === '/contexts/view'}
      pl={40}
      data-testid="context-link-none"
    />,
  ];

  return (
    <>
      <NavLink
        href="#"
        label="Contexts"
        active={router.pathname === '/contexts' && !query?.context}
        leftSection={<IconManualGearboxFilled />}
      />
      {links}
    </>
  );
}
