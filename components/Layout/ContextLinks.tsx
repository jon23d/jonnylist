import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { NavLink } from '@mantine/core';
import { useDataSource } from '@/contexts/DataSourceContext';
import { UnsubscribeFunction } from '@/data/DataSource';

export default function ContextLinks() {
  const dataSource = useDataSource();
  const router = useRouter();
  const query = router.query;
  const [contexts, setContexts] = useState<string[]>([]);

  useEffect(() => {
    let unsubscribe: UnsubscribeFunction;

    const subscribe = async () => {
      unsubscribe = await dataSource.watchContexts(setContexts);
    };
    subscribe();

    return () => {
      unsubscribe();
    };
  }, []);

  return contexts.map((context) => (
    <NavLink
      key={context}
      href={`/contexts/view?name=${context}`}
      label={context}
      component={Link}
      active={query?.name === context && router.pathname === '/contexts/view'}
      pl={40}
    />
  ));
}
