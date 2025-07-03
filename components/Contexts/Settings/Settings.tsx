import { Fieldset } from '@mantine/core';
import RenameForm from '@/components/Contexts/Settings/RenameForm';

export default function Settings({
  contextName,
  onClose,
}: {
  contextName: string;
  onClose: () => void;
}) {
  return (
    <>
      <Fieldset legend="Rename context">
        <RenameForm contextName={contextName} onClose={onClose} />
      </Fieldset>
    </>
  );
}
