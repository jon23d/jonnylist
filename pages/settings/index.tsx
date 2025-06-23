import { Fieldset, Title } from '@mantine/core';
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
    </>
  );
}
