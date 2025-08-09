import { useEffect, useState } from 'react';
import { IconDatabaseCog, IconHash, IconRefresh } from '@tabler/icons-react';
import { Fieldset, Stack, Tabs } from '@mantine/core';
import CoefficientsForm from '@/components/Settings/CoefficientsForm';
import DeleteDataForm from '@/components/Settings/DeleteDataForm';
import ExportForm from '@/components/Settings/ExportForm';
import ImportForm from '@/components/Settings/ImportForm';
import SyncServerForm from '@/components/Settings/SyncServerForm';
import { useDataSource, usePreferencesRepository } from '@/contexts/DataSourceContext';
import { LocalSettings } from '@/data/documentTypes/LocalSettings';
import { Preferences } from '@/data/documentTypes/Preferences';

export default function Page() {
  const dataSource = useDataSource();
  const preferencesRepository = usePreferencesRepository();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [localSettings, setLocalSettings] = useState<LocalSettings | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const preferences = await preferencesRepository.getPreferences();
      setPreferences(preferences);
      const localSettings = await dataSource.getLocalSettings();
      setLocalSettings(localSettings);
    };
    fetchData();
  }, []);

  if (preferences === null || localSettings === null) {
    return 'Loading...';
  }

  return (
    <>
      <Tabs defaultValue="sync-server">
        <Tabs.List mb={20}>
          <Tabs.Tab value="sync-server" leftSection={<IconRefresh size={15} />}>
            Sync Server
          </Tabs.Tab>
          <Tabs.Tab value="data" leftSection={<IconDatabaseCog size={15} />}>
            Data
          </Tabs.Tab>
          <Tabs.Tab value="coefficients" leftSection={<IconHash size={15} />}>
            Coefficients
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="sync-server">
          <SyncServerForm localSettings={localSettings} />
        </Tabs.Panel>

        <Tabs.Panel value="data">
          <Fieldset legend="Data Export" mb="md">
            <ExportForm />
          </Fieldset>

          <Fieldset legend="Data Import" mb="md">
            <ImportForm />
          </Fieldset>

          <Fieldset legend="Delete data" mb="md">
            <DeleteDataForm />
          </Fieldset>
        </Tabs.Panel>

        <Tabs.Panel value="coefficients">
          <CoefficientsForm preferences={preferences} />
        </Tabs.Panel>
      </Tabs>
      <Stack />
    </>
  );
}
