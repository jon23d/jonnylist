import { useState } from 'react';
import { Button, Text } from '@mantine/core';
import { useDataSource } from '@/contexts/DataSourceContext';
import { Notifications } from '@/helpers/Notifications';

export default function ExportForm() {
  const dataSource = useDataSource();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    const filename = `jonnylist-${new Date().toISOString()}.json`;

    try {
      const data = await dataSource.exportAllData();
      const jsonString = JSON.stringify(data, null, 2);

      // Create a blob with the JSON data
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      Notifications.showError({
        title: 'Export Failed',
        message: 'An error occurred while exporting your data.',
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Text>This will export all data from your database, except for your sync settings</Text>
      <Button onClick={handleExport} loading={loading}>
        Export my data
      </Button>
    </>
  );
}
