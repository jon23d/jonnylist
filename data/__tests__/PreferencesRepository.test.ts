import { Preferences } from '@/data/documentTypes/Preferences';
import { setupTestDatabase } from '@/test-utils/db';
import { preferencesFactory } from '@/test-utils/factories/PreferencesFactory';
import { PreferencesRepository } from '../PreferencesRepository';

jest.mock('@/data/documentTypes/Preferences', () => ({
  createDefaultPreferences: jest.fn(() => ({
    lastSelectedContext: 'context1',
  })),
}));

describe('PreferencesRepository', () => {
  const { getDb } = setupTestDatabase();

  test('getPreferences should return default preferences', async () => {
    const preferencesRepository = new PreferencesRepository(getDb());

    const preferences = await preferencesRepository.getPreferences();
    expect(preferences).toEqual({
      lastSelectedContext: 'context1',
    });
  });

  test('getPreferences should return stored preferences', async () => {
    const database = getDb();
    const preferencesRepository = new PreferencesRepository(database);

    await database.post<Preferences>(
      preferencesFactory({
        lastSelectedContext: 'context2',
      })
    );

    const preferences = await preferencesRepository.getPreferences();
    expect(preferences.lastSelectedContext).toBe('context2');
  });

  test('setPreferences should create new preferences in the database', async () => {
    const preferencesRepository = new PreferencesRepository(getDb());
    const newPreferences = preferencesFactory({
      lastSelectedContext: 'foo-context',
    });

    await preferencesRepository.setPreferences(newPreferences);

    const preferences = await preferencesRepository.getPreferences();
    expect(preferences.lastSelectedContext).toBe('foo-context');
  });

  test('setPreferences should update existing preferences', async () => {
    const preferencesRepository = new PreferencesRepository(getDb());
    const newPreferences = preferencesFactory({
      lastSelectedContext: 'foo-context',
    });

    await preferencesRepository.setPreferences(newPreferences);

    const preferences = await preferencesRepository.getPreferences();
    expect(preferences.lastSelectedContext).toBe('foo-context');

    preferences.lastSelectedContext = 'poo-context';
    await preferencesRepository.setPreferences(preferences);

    const updatedPreferences = await preferencesRepository.getPreferences();
    expect(updatedPreferences.lastSelectedContext).toBe('poo-context');
  });
});
