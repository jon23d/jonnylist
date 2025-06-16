import { Migration } from '@/data/migrations/Migration'; // Assuming you have this interface
import { MigrationManager } from '@/data/migrations/MigrationManager';

let mockVersionsArray: Migration[] = [];

jest.mock('@/data/migrations/versions/Versions', () => ({
  get VERSIONS() {
    return mockVersionsArray;
  },
}));

describe('MigrationManager', () => {
  beforeEach(() => {
    // Reset to an empty array or a default minimal mock for each test
    mockVersionsArray = [];
  });

  describe('needsMigration', () => {
    it('Should check migrations to see if it needs to be run', async () => {
      const needsOne = jest.fn().mockResolvedValue(false);
      const needsTwo = jest.fn().mockResolvedValue(false);

      mockVersionsArray = [
        {
          getVersion: jest.fn().mockReturnValue(1),
          needsMigration: needsOne,
          up: jest.fn(),
        },
        {
          getVersion: jest.fn().mockReturnValue(2),
          needsMigration: needsTwo,
          up: jest.fn(),
        },
      ];

      const db = jest.fn() as unknown as PouchDB.Database;
      const migrationManager = new MigrationManager(db);

      await migrationManager.needsMigration();

      expect(needsOne).toHaveBeenCalledWith(db);
      expect(needsTwo).toHaveBeenCalledWith(db);
    });

    it('Should return true if any migration needs to be run', async () => {
      const needsOne = jest.fn().mockResolvedValue(true);
      const needsTwo = jest.fn().mockResolvedValue(false);

      mockVersionsArray = [
        { getVersion: jest.fn(), needsMigration: needsOne, up: jest.fn() },
        { getVersion: jest.fn(), needsMigration: needsTwo, up: jest.fn() },
      ];

      const db = jest.fn() as unknown as PouchDB.Database;
      const migrationManager = new MigrationManager(db);

      const result = await migrationManager.needsMigration();

      expect(result).toBe(true);
      expect(needsOne).toHaveBeenCalledWith(db);
      expect(needsTwo).not.toHaveBeenCalledWith(db); // Should not be called because of short-circuiting
    });

    it('Should return false if no migrations need to be run', async () => {
      const needsOne = jest.fn().mockResolvedValue(false);
      const needsTwo = jest.fn().mockResolvedValue(false);

      mockVersionsArray = [
        { getVersion: jest.fn(), needsMigration: needsOne, up: jest.fn() },
        { getVersion: jest.fn(), needsMigration: needsTwo, up: jest.fn() },
      ];

      const db = jest.fn() as unknown as PouchDB.Database;
      const migrationManager = new MigrationManager(db);

      const result = await migrationManager.needsMigration();
      expect(result).toBe(false);
    });
  });

  describe('runMigrations', () => {
    it('Should run all migrations that need to be run', async () => {
      const needsOne = jest.fn().mockResolvedValue(false); // Does not need to run
      const upOne = jest.fn();

      const needsTwo = jest.fn().mockResolvedValue(true); // Needs to run
      const upTwo = jest.fn().mockResolvedValue(undefined);

      const needsThree = jest.fn().mockResolvedValue(true); // Needs to run
      const upThree = jest.fn().mockResolvedValue(undefined);

      mockVersionsArray = [
        { getVersion: jest.fn(), needsMigration: needsOne, up: upOne },
        { getVersion: jest.fn(), needsMigration: needsTwo, up: upTwo },
        { getVersion: jest.fn(), needsMigration: needsThree, up: upThree },
      ];

      const db = jest.fn() as unknown as PouchDB.Database;
      const migrationManager = new MigrationManager(db);

      await migrationManager.runMigrations();

      expect(upOne).not.toHaveBeenCalled();
      expect(upTwo).toHaveBeenCalledWith(db);
      expect(upThree).toHaveBeenCalledWith(db);
    });
  });
});
