# Database architecture

This application uses [PouchDB](https://www.pouchdb.com) for nosql local storage, with an optional
[CouchDB](https://couchdb.apache.org/) server for remote synchronization.

## Local Database

The local database is made accessible through a class that implements the [DataSource](../data/DataSource.ts) interface.
Locally, we use the [LocalDataSource](../data/LocalDataSource.ts) class, which is a wrapper around PouchDB via a
SharedWorker. We use the SharedWorker in order to allow multiple tabs to share the same database connection, which is
important for performance and consistency.

## Migrations

The database schema is versioned, and migrations are handled automatically by the LocalDataSource class.
When the application starts, it checks the current database version and applies any necessary migrations in order. This
operation is local to the SharedWorker. While migrations are being applied, the application will not be able to
access the database. The application will show a loading screen until the migrations are complete.

### Remote Database

Because multiple clients could potentially be migrating simultaneously, we rely upon CouchDB to handle conflicts for us.
If a conflict occurs, a client will compare the remote and local version. Assuming they are identical, the client will
take the remote version. If they differ, the client will prompt the user to resolve the conflict manually.