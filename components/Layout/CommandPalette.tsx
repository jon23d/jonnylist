import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { IconManualGearboxFilled, IconSearch, IconSettings } from '@tabler/icons-react';
import { Spotlight, SpotlightActionData } from '@mantine/spotlight';
import { useDataSource } from '@/contexts/DataSourceContext';

export default function CommandPalette() {
  const router = useRouter();
  const dataSource = useDataSource();
  const [contexts, setContexts] = useState<string[]>([]);

  const actions: SpotlightActionData[] = [
    {
      id: 'settings',
      title: 'Settings',
      description: 'Open settings',
      onClick: () => router.push('/settings'),
      leftSection: <IconSettings size={24} stroke={1.5} />,
    },
  ];
  contexts.forEach((context) => {
    actions.push({
      id: `context-${context}`,
      title: context,
      description: `View context: ${context}`,
      onClick: () => router.push(`/contexts/view?name=${context}`),
      leftSection: <IconManualGearboxFilled size={24} stroke={1.5} />,
    });
  });

  useEffect(() => {
    const unsubscribe = dataSource.subscribeToContexts(setContexts);

    return () => {
      unsubscribe();
    };
  }, [dataSource]);

  return (
    <>
      <Spotlight
        actions={actions}
        nothingFound="Nothing found..."
        highlightQuery
        searchProps={{
          leftSection: <IconSearch size={20} stroke={1.5} />,
          placeholder: 'Search...',
        }}
      />
    </>
  );
}
