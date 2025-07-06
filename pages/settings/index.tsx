import { Fieldset, Stack, Title } from '@mantine/core';
import DeleteForm from '@/components/Settings/DeleteForm';
import ExportForm from '@/components/Settings/ExportForm';
import ImportForm from '@/components/Settings/ImportForm';
import SyncServerForm from '@/components/Settings/SyncServerForm';

export default function Page() {
  return (
    <Stack>
      <Title order={2} mb="md">
        Settings
      </Title>

      <Fieldset legend="Sync Server" mb="md">
        <SyncServerForm />
      </Fieldset>

      <Fieldset legend="Data Export" mb="md">
        <ExportForm />
      </Fieldset>

      <Fieldset legend="Data Import" mb="md">
        <ImportForm />
      </Fieldset>

      <Fieldset legend="Delete data" mb="md">
        <DeleteForm />
      </Fieldset>
    </Stack>
  );
}
