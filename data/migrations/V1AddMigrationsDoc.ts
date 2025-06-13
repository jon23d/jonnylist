import PouchDB from 'pouchdb';

class V1AddMigrationsDoc {
  async up(db: PouchDB.Database): Promise<void> {
    // Check if the migrations document already exists
    try {
      await db.get('migrations'); // If it exists, we can skip this migration
      return;
    } catch (err) {
      if (err instanceof Error && err.name !== 'not_found') {
        // If the error is not a "not found" error, rethrow it
        throw err;
      }
      // If it is a "not found" error, we proceed to create the migrations document
    }

    const migrationsDoc = {
      _id: 'migrations',
      version: 1,
      migrations: [],
    };

    await db.put(migrationsDoc);
  }

  async down(db: any): Promise<void> {
    await db.collection('migrations').deleteOne({ _id: 'migrations' });
  }
}
