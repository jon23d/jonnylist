import { Context } from '@/data/documentTypes/Context';
import { MigrationsDoc } from '@/data/documentTypes/MigrationsDoc';
import { Migration } from '../Migration';

class V9ClearMinimumDaysFromContextFilters implements Migration {
  getVersion(): number {
    return 9;
  }

  async needsMigration(db: PouchDB.Database): Promise<boolean> {
    const migrations = await db.get<MigrationsDoc>('migrations');
    return !(migrations && migrations.version >= this.getVersion());
  }

  async up(db: PouchDB.Database): Promise<void> {
    const result = await db.allDocs<Context>({
      include_docs: true,
      startkey: 'context-',
      endkey: 'context-\ufff0',
    });

    const contexts = result.rows.map((row) => row.doc!);

    // Iterate through each context and update the due dates to remove '0' from minimumDaysFromToday
    // and 0 from maximumDaysFromToday, making them undefined
    for (const context of contexts) {
      if (context.filter?.dueWithin) {
        const dueWithin = context.filter.dueWithin;

        // Convert minimumNumberOfDaysFromToday and maximumNumberOfDaysFromToday to numbers
        if (dueWithin.minimumNumberOfDaysFromToday === 0) {
          delete dueWithin.minimumNumberOfDaysFromToday;
        }

        if (dueWithin.maximumNumberOfDaysFromToday === 0) {
          delete dueWithin.maximumNumberOfDaysFromToday;
        }

        // Update the context in the database
        await db.put(context);
      }
    }

    // Update the migrations document to reflect the new version
    const migrationsDoc = await db.get<MigrationsDoc>('migrations');
    migrationsDoc.version = 9;
    await db.put(migrationsDoc);
  }
}

export default V9ClearMinimumDaysFromContextFilters;
