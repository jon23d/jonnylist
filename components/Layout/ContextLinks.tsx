import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconManualGearboxFilled } from '@tabler/icons-react';
import { NavLink } from '@mantine/core';
import { useDataSource } from '@/contexts/DataSourceContext';

export default function ContextLinks({
  handleNavLinkClick,
}: {
  handleNavLinkClick: (url: string) => void;
}) {
  const dataSource = useDataSource();
  const router = useRouter();
  const query = router.query;
  const [contexts, setContexts] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = dataSource.subscribeToContexts(setContexts);

    return () => {
      unsubscribe();
    };
  }, [dataSource]);

  const links = contexts.map((context) => (
    <NavLink
      key={context}
      onClick={() => handleNavLinkClick(`/contexts/view?name=${context}`)}
      label={context}
      active={query?.name === context && router.pathname === '/contexts/view'}
      pl={40}
      data-testid={`context-link-${context}`}
    />
  ));

  return (
    <>
      <NavLink
        onClick={() => handleNavLinkClick('/contexts')}
        label="Contexts"
        active={router.pathname === '/contexts' && !query?.context}
        leftSection={<IconManualGearboxFilled />}
      />
      {links}
    </>
  );
}
