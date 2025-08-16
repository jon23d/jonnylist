import React, { useEffect, useState } from 'react';
import { IconManualGearboxFilled } from '@tabler/icons-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { NavLink } from '@mantine/core';
import { useContextRepository } from '@/contexts/DataSourceContext';
import { Context } from '@/data/documentTypes/Context';

export default function ContextLinks({
  handleNavLinkClick,
}: {
  handleNavLinkClick: (url: string) => void;
}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const contextRepository = useContextRepository();
  const [contexts, setContexts] = useState<Context[]>([]);

  useEffect(() => {
    const unsubscribe = contextRepository.subscribeToContexts(setContexts);

    return unsubscribe;
  }, []);

  const querystringContext = searchParams.get('context');

  const links = [
    <NavLink
      key="None"
      onClick={() => handleNavLinkClick(`/tasks`)}
      label="None"
      active={location.pathname === '/tasks' && !querystringContext}
      data-testid="context-link-none"
    />,
  ];

  contexts.forEach((context) => {
    links.push(
      <NavLink
        key={context._id}
        onClick={() => handleNavLinkClick(`/tasks?context=${context._id}`)}
        label={context.name}
        active={querystringContext === context._id}
      />
    );
  });

  return (
    <>
      <NavLink href="#" label="Contexts" leftSection={<IconManualGearboxFilled />} defaultOpened>
        {links}
      </NavLink>
    </>
  );
}
