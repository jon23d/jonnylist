import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Alert, Button, Stack, Text, TextInput } from '@mantine/core';
import { useDataSource } from '@/contexts/DataSourceContext';
import { Notifications } from '@/helpers/Notifications';

export default function DeleteDataForm() {
  const router = useRouter();
  const dataSource = useDataSource();

  const [randomNumbers, setRandomNumbers] = useState<null | { num1: number; num2: number }>(null);
  const [userAnswer, setUserAnswer] = useState('');

  useEffect(() => {
    setRandomNumbers({
      num1: Math.floor(Math.random() * 30) + 1,
      num2: Math.floor(Math.random() * 30) + 1,
    });
  }, []);

  const equation = randomNumbers
    ? `${randomNumbers.num1} + ${randomNumbers.num2} = ?`
    : 'Loading...';
  const correctAnswer = (randomNumbers?.num1 || 0) + (randomNumbers?.num2 || 0);

  const handleDelete = async () => {
    const database = dataSource.getDatabase();

    // Cancel all feeds
    await dataSource.cleanup();

    // Delete the local database
    await database.destroy();

    await router.push('/');
    Notifications.showSuccess({
      title: 'Success!',
      message: 'Your local data has been deleted.',
    });
    window.location.reload();
  };

  return (
    <Stack>
      <Alert color="red" title="Warning!">
        <Text fw={700}>This IS a destructive action!</Text>

        <Text mt={10}>
          ALL of your local data will be permanently deleted, and your local state will be reset.
        </Text>

        <Text mt={10}>
          If sync is enabled, this will NOT delete the sync database. If you connect to the same
          database again, your data will be restored.
        </Text>
      </Alert>

      <Text />
      <TextInput
        label="Solve the equation to confirm deletion"
        value={userAnswer}
        placeholder={equation}
        disabled={!randomNumbers}
        onChange={(e) => setUserAnswer(e.currentTarget.value)}
      />
      <Button
        disabled={randomNumbers !== null && parseInt(userAnswer, 10) !== correctAnswer}
        onClick={handleDelete}
      >
        Delete my data
      </Button>
    </Stack>
  );
}
