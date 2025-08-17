import React, { useEffect, useState } from 'react';
import { IconManualGearboxFilled } from '@tabler/icons-react';
import clsx from 'clsx';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Flex, NavLink } from '@mantine/core';
import ContextModifier from '@/components/Contexts/ContextModifier';
import { useContextRepository } from '@/contexts/DataSourceContext';
import { Context } from '@/data/documentTypes/Context';
import classes from './Layout.module.css';

export default function ContextLinks({
  handleNavLinkClick,
}: {
  handleNavLinkClick: (url: string) => void;
}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const contextRepository = useContextRepository();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

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
      <Flex
        align="center"
        key={context._id}
        onMouseEnter={() => setHovered(context._id)}
        onMouseLeave={() => setHovered(null)}
        className={clsx(
          classes.contextNavLink,
          querystringContext === context._id ? classes.active : ''
        )}
      >
        <NavLink
          onClick={() => handleNavLinkClick(`/tasks?context=${context._id}`)}
          label={context.name}
        />
        <ContextModifier context={context} visible={hovered === context._id} />
      </Flex>
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
