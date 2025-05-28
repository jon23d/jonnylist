import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { NavLink } from '@mantine/core';
import { useDataSource } from '@/contexts/DataSourceContext';

export default function ContextLinks() {
  const dataSource = useDataSource();
  const router = useRouter();
  const query = router.query;
  const [contexts, setContexts] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = dataSource.watchContexts(setContexts);

    return () => {
      unsubscribe();
    };
  }, [dataSource]);

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
