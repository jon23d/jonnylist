import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconManualGearboxFilled } from '@tabler/icons-react';
import { NavLink } from '@mantine/core';
import { useContextRepository } from '@/contexts/DataSourceContext';
import { Context } from '@/data/documentTypes/Context';

export default function ContextLinks({
  handleNavLinkClick,
}: {
  handleNavLinkClick: (url: string) => void;
}) {
  const router = useRouter();
  const contextRepository = useContextRepository();
  const [contexts, setContexts] = useState<Context[]>([]);

  useEffect(() => {
    const unsubscribe = contextRepository.subscribeToContexts(setContexts);

    return unsubscribe;
  }, []);

  const links = [
    <NavLink
      key="None"
      onClick={() => handleNavLinkClick(`/tasks`)}
      label="None"
      active={router.pathname === '/tasks' && !router.query.context}
      pl={40}
      data-testid="context-link-none"
    />,
  ];

  contexts.forEach((context) => {
    links.push(
      <NavLink
        key={context._id}
        onClick={() => handleNavLinkClick(`/tasks?context=${context._id}`)}
        label={context.name}
        active={router.query.context === context._id}
        pl={40}
        data-testid={`context-link-${context._id}`}
      />
    );
  });

  return (
    <>
      <NavLink href="#" label="Contexts" leftSection={<IconManualGearboxFilled />} />
      {links}
    </>
  );
}
