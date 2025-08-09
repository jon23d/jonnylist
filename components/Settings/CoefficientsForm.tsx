import React from 'react';
import { Button, NumberInput, SimpleGrid, Stack } from '@mantine/core';
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

  const form = useForm({
    initialValues: {
      ...defaultCoefficients,
      ...preferences.coefficients,
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
    form.setValues(defaultCoefficients);
  };

  return (
    <>
      <form onSubmit={form.onSubmit(handleSubmit)}>
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
          <Button type="submit">Save Coefficients</Button>
          <Button onClick={resetToDefaults}>Reset to Defaults</Button>
        </SimpleGrid>
      </form>
    </>
  );
}
