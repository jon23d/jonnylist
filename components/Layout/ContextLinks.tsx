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
    const fetchData = async () => {
      return await dataSource.getContexts();
    };
    fetchData().then(setContexts);
  }, []);

  return contexts.map((context) => (
    <NavLink
      key={context}
      href={`/contexts/?context=${context}`}
      label={context}
      component={Link}
      active={query?.context === context}
      pl={40}
    />
  ));
}
