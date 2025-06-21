import { useEffect, useState } from 'react';
import { Fieldset } from '@mantine/core';
import ArchivalForm from '@/components/Contexts/Settings/ArchivalForm';
import RenameForm from '@/components/Contexts/Settings/RenameForm';
import { useDataSource } from '@/contexts/DataSourceContext';

export default function Settings({
  contextName,
  onClose,
}: {
  contextName: string;
  onClose: () => void;
}) {
  const dataSource = useDataSource();
  const [destinationContexts, setDestinationContexts] = useState<string[]>([]);

  useEffect(() => {
    // Get the contexts for the archival radio options
    const fetchContexts = async () => {
      const contexts = await dataSource.getContexts();
      setDestinationContexts(contexts.filter((c) => c !== contextName));
    };
    fetchContexts();
  }, [contextName]);

  return (
    <>
      <Fieldset legend="Rename context">
        <RenameForm contextName={contextName} onClose={onClose} />
      </Fieldset>

      <Fieldset legend="Archive context" mt={20} mb={20}>
        <ArchivalForm
          sourceContext={contextName}
          destinationContexts={destinationContexts}
          onClose={onClose}
        />
      </Fieldset>
    </>
  );
}
