import React from 'react';
import { IconCirclePlus, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { usePreferencesRepository } from '@/contexts/DataSourceContext';
import { Preferences } from '@/data/documentTypes/Preferences';
import { Logger } from '@/helpers/Logger';
import { Notifications } from '@/helpers/Notifications';
import { defaultCoefficients } from '@/helpers/Tasks';

const isPresent = (value: string | number): string | null => {
  return value === '' ? 'Must be numeric' : null;
};

export default function CoefficientsForm({ preferences }: { preferences: Preferences }) {
  const preferencesRepository = usePreferencesRepository();
  const [dbPreferences, setDbPreferences] = React.useState<Preferences>(preferences);
  const theme = useMantineTheme();

  const form = useForm({
    initialValues: {
      ...defaultCoefficients,
      ...preferences.coefficients,
      customCoefficients: preferences.coefficients?.customCoefficients || [],
    },
    validate: {
      nextTag: isPresent,
      nearDueDate: isPresent,
      highPriority: isPresent,
      mediumPriority: isPresent,
      lowPriority: isPresent,
      startedStatus: isPresent,
      hasDescription: isPresent,
      hasTags: isPresent,
      hasProject: isPresent,
      ageCoefficient: isPresent,
      customCoefficients: {
        name: (value) => (value.length < 1 ? 'Required' : null),
        value: isPresent,
      },
    },
  });

  const handleSubmit = async () => {
    try {
      const updatedPreferences = await preferencesRepository.setPreferences({
        ...dbPreferences,
        coefficients: {
          ...form.values,
        },
      });
      setDbPreferences(updatedPreferences);
      Notifications.showQuickSuccess('Updated coefficients');
    } catch (error) {
      Logger.error('Error persisting coefficients', error);
      Notifications.showError({ title: 'Error', message: 'Unable to save coefficients' });
    }
  };

  const resetToDefaults = () => {
    form.setValues({ ...defaultCoefficients, customCoefficients: [] });
  };

  const handleAddCustomCoefficient = () => {
    form.insertListItem('customCoefficients', {
      type: 'tag',
      name: '',
      value: 0,
    });
  };

  const customCoefficientFields = form.values.customCoefficients.map((_item, index) => (
    <Group key={index} mt="xs">
      <Select
        placeholder="Pick value"
        data={[
          { label: 'Has tag', value: 'tag' },
          { label: 'Project starts with', value: 'project' },
        ]}
        {...form.getInputProps(`customCoefficients.${index}.type`)}
      />
      <TextInput
        placeholder="Name"
        withAsterisk
        style={{ flex: 1 }}
        {...form.getInputProps(`customCoefficients.${index}.name`)}
      />
      <NumberInput
        placeholder="Coefficient"
        withAsterisk
        {...form.getInputProps(`customCoefficients.${index}.value`)}
      />
      <ActionIcon
        color="red"
        onClick={() => form.removeListItem('customCoefficients', index)}
        aria-label="Delete coefficient"
        variant="subtle"
      >
        <IconTrash size="1rem" />
      </ActionIcon>
    </Group>
  ));

  return (
    <>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Title order={3}>Standard Coefficients</Title>
          <Text color="gray.7">
            Coefficients are used to calculate a task's urgency. Urgency is calculated as a weighted
            sum of various factors, such as priority, due date, and whether the task has a
            description or tags. The coefficients below can be adjusted to change how urgency is
            calculated.
          </Text>
          <SimpleGrid cols={2}>
            <Stack>
              <NumberInput
                label="Next Tag"
                {...form.getInputProps('nextTag')}
                description="Does the task have a #next tag? Default 15"
              />

              <NumberInput
                label="Near Due Date"
                {...form.getInputProps('nearDueDate')}
                description="Is the task due within the next 5 days, or is it overdue? Default 12"
              />

              <NumberInput
                label="High Priority"
                {...form.getInputProps('highPriority')}
                description="Is the task high priority? Default 6"
              />

              <NumberInput
                label="Medium Priority"
                {...form.getInputProps('mediumPriority')}
                description="Is the task medium priority? Default 3.9"
              />

              <NumberInput
                label="Low Priority"
                {...form.getInputProps('lowPriority')}
                description="Is the task low priority? Default 1.8"
              />
            </Stack>
            <Stack>
              <NumberInput
                label="Started Status"
                {...form.getInputProps('startedStatus')}
                description="Has the task begun? Default 8"
              />

              <NumberInput
                label="Has Description"
                {...form.getInputProps('hasDescription')}
                description="Does the task have a description? Default 1"
              />

              <NumberInput
                label="Has Tags"
                {...form.getInputProps('hasTags')}
                description="Does the task have tags? Default 1"
              />

              <NumberInput
                label="Has Project"
                {...form.getInputProps('hasProject')}
                description="Does the task have a project? Default 1"
              />

              <NumberInput
                label="Age Coefficient"
                {...form.getInputProps('ageCoefficient')}
                description="Coefficient based on task age in days. Default 2"
              />
            </Stack>
          </SimpleGrid>

          <Box>
            <Group justify="space-between">
              <Title order={3}>Custom Coefficients</Title>
              <Button
                mt="md"
                onClick={handleAddCustomCoefficient}
                variant="subtle"
                leftSection={<IconCirclePlus size={16} stroke={1.5} color={theme.colors.blue[5]} />}
              >
                Add Custom Coefficient
              </Button>
            </Group>

            {customCoefficientFields.length ? (
              customCoefficientFields
            ) : (
              <Text c="gray.7" mt="sm">
                No custom coefficients defined.
              </Text>
            )}
          </Box>

          <Group mt="xl">
            <Button type="submit">Save Coefficients</Button>
            <Button onClick={resetToDefaults}>Reset to Defaults</Button>
          </Group>
        </Stack>
      </form>
    </>
  );
}
