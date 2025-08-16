import { Migration } from '@/data/migrations/Migration'; // Assuming you have this interface
import { MigrationManager } from '@/data/migrations/MigrationManager';

let mockVersionsArray: Migration[] = [];

vi.mock('@/data/migrations/versions/Versions', () => ({
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
      const needsOne = vi.fn().mockResolvedValue(false);
      const needsTwo = vi.fn().mockResolvedValue(false);

      mockVersionsArray = [
        {
          getVersion: vi.fn().mockReturnValue(1),
          needsMigration: needsOne,
          up: vi.fn(),
        },
        {
          getVersion: vi.fn().mockReturnValue(2),
          needsMigration: needsTwo,
          up: vi.fn(),
        },
      ];

      const db = vi.fn() as unknown as PouchDB.Database;
      const migrationManager = new MigrationManager(db);

      await migrationManager.needsMigration();

      expect(needsOne).toHaveBeenCalledWith(db);
      expect(needsTwo).toHaveBeenCalledWith(db);
    });

    it('Should return true if any migration needs to be run', async () => {
      const needsOne = vi.fn().mockResolvedValue(true);
      const needsTwo = vi.fn().mockResolvedValue(false);

      mockVersionsArray = [
        { getVersion: vi.fn(), needsMigration: needsOne, up: vi.fn() },
        { getVersion: vi.fn(), needsMigration: needsTwo, up: vi.fn() },
      ];

      const db = vi.fn() as unknown as PouchDB.Database;
      const migrationManager = new MigrationManager(db);

      const result = await migrationManager.needsMigration();

      expect(result).toBe(true);
      expect(needsOne).toHaveBeenCalledWith(db);
      expect(needsTwo).not.toHaveBeenCalledWith(db); // Should not be called because of short-circuiting
    });

    it('Should return false if no migrations need to be run', async () => {
      const needsOne = vi.fn().mockResolvedValue(false);
      const needsTwo = vi.fn().mockResolvedValue(false);

      mockVersionsArray = [
        { getVersion: vi.fn(), needsMigration: needsOne, up: vi.fn() },
        { getVersion: vi.fn(), needsMigration: needsTwo, up: vi.fn() },
      ];

      const db = vi.fn() as unknown as PouchDB.Database;
      const migrationManager = new MigrationManager(db);

      const result = await migrationManager.needsMigration();
      expect(result).toBe(false);
    });
  });

  describe('runMigrations', () => {
    it('Should run all migrations that need to be run', async () => {
      const needsOne = vi.fn().mockResolvedValue(false); // Does not need to run
      const upOne = vi.fn();

      const needsTwo = vi.fn().mockResolvedValue(true); // Needs to run
      const upTwo = vi.fn().mockResolvedValue(undefined);

      const needsThree = vi.fn().mockResolvedValue(true); // Needs to run
      const upThree = vi.fn().mockResolvedValue(undefined);

      mockVersionsArray = [
        { getVersion: vi.fn(), needsMigration: needsOne, up: upOne },
        { getVersion: vi.fn(), needsMigration: needsTwo, up: upTwo },
        { getVersion: vi.fn(), needsMigration: needsThree, up: upThree },
      ];

      const db = vi.fn() as unknown as PouchDB.Database;
      const migrationManager = new MigrationManager(db);

      await migrationManager.runMigrations();

      expect(upOne).not.toHaveBeenCalled();
      expect(upTwo).toHaveBeenCalledWith(db);
      expect(upThree).toHaveBeenCalledWith(db);
    });
  });
});
