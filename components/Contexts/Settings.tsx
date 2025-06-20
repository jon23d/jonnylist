import { useEffect, useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { Alert, Button, Fieldset, Flex, Radio, Text, TextInput } from '@mantine/core';
import { useDataSource } from '@/contexts/DataSourceContext';

export default function Settings({ contextName }: { contextName: string }) {
  const dataSource = useDataSource();
  const [contextNames, setContextNames] = useState<string[]>([]);

  useEffect(() => {
    // Get the contexts for the archival radio options
    const fetchContexts = async () => {
      const contexts = await dataSource.getContexts();
      setContextNames(contexts.filter((c) => c !== contextName));
    };
    fetchContexts();
  }, [contextName]);

  return (
    <>
      <Fieldset legend="Rename context">
        <Flex align="end" justify="space-between">
          <TextInput value={contextName} label="Context name" />
          <Button disabled>Update name</Button>
        </Flex>
      </Fieldset>

      <Fieldset legend="Archive context" mt={20} mb={20}>
        <Alert color="orange" icon={<IconInfoCircle />}>
          <Text mb={20}>All open tasks with will be moved to a new context while archiving.</Text>
          <Text>Open tasks are those with a status of Ready, Waiting, or Started.</Text>
        </Alert>

        <Radio.Group label={<Text mb={10}>Choose destination context</Text>} mt={20}>
          {contextNames.map((c) => (
            <Radio value={c} label={c} />
          ))}
        </Radio.Group>

        <Button variant="outline" color="red" fullWidth mt={20}>
          Archive
        </Button>
      </Fieldset>
    </>
  );
}
