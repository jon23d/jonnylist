import { Fieldset, Title } from '@mantine/core';
import ExportForm from '@/components/Settings/ExportForm';
import SyncServerForm from '@/components/Settings/SyncServerForm';

export default function Page() {
  return (
    <>
      <Title order={2} mb="md">
        Settings
      </Title>

      <Fieldset legend="Sync Server" mb="md">
        <SyncServerForm />
      </Fieldset>

      <Fieldset legend="Data Export" mb="md">
        <ExportForm />
      </Fieldset>
    </>
  );
}
