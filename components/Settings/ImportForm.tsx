import { useState } from 'react';
import { Alert, Button, FileInput, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useBulkOperationOverlay } from '@/contexts/BulkOperationOverlayContext';
import { useDataSource } from '@/contexts/DataSourceContext';
import { Notifications } from '@/helpers/Notifications';

export default function ImportForm() {
  const dataSource = useDataSource();
  const { showOverlay, hideOverlay } = useBulkOperationOverlay();
  const [value, setValue] = useState<File | null>(null);

  const handleSubmit = () => {
    modals.openConfirmModal({
      title: 'Archive Context?',
      children: <Text size="sm">This action cannot be undone!</Text>,
      labels: { confirm: 'Import my data', cancel: 'Cancel' },
      confirmProps: { color: 'orange' },
      onConfirm: handleConfirm,
    });
  };

  const handleConfirm = async () => {
    // Show an overlay while the import is happening
    showOverlay({
      title: 'Importing Data',
      description: 'Hold tight while we import your data...',
    });

    try {
      const fileContent = await value!.text();
      const jsonData = JSON.parse(fileContent);
      await dataSource.importData(jsonData);

      Notifications.showSuccess({
        title: 'Import Successful',
        message: 'Your data has been successfully imported.',
      });

      setValue(null);
      modals.closeAll();
    } catch (error) {
      let errorMessage = 'An error occurred while importing your data';

      // Provide more specific error messages
      if (error instanceof SyntaxError) {
        errorMessage = 'Invalid JSON file format';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Notifications.showError({
        title: 'Import Failed',
        message: errorMessage,
      });
    } finally {
      await hideOverlay();
    }
  };

  return (
    <Stack>
      <Alert color="red" title="Warning!">
        <Text fw={700}>
          This can be a destructive action, and has the ability to overwrite your existing data.
        </Text>

        <Text mt={10}>Importing your data will append to your existing data.</Text>
        <Text mt={10}>If sync is enabled, your imports will also be synced</Text>
      </Alert>

      <FileInput
        label="Import File"
        placeholder="Select a file to import"
        accept=".json"
        value={value}
        onChange={setValue}
      />
      <Button onClick={handleSubmit} disabled={!value}>
        Import
      </Button>
    </Stack>
  );
}
