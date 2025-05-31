# Database architecture

This application uses [PouchDB](https://www.pouchdb.com) for nosql local storage, with an optional
[CouchDB](https://couchdb.apache.org/) server for remote synchronization.

## Local Database

The local database is made accessible through a class that implements the [DataSource](../data/DataSource.ts) interface.
Locally, we use the [LocalDataSource](../data/LocalDataSource.ts) class, which is a wrapper around PouchDB. PouchDb's feeds will provide
implicit local synchronization, meaning that any changes made to the local database will be immediately available
to any tab accessing the application.

## Migrations

The database schema is versioned, and migrations are handled automatically by the LocalDataSource class.
When the application starts, it checks the current database version and applies any necessary migrations in order.
While migrations are being applied, the application will not be able to access the database. The application will
show a loading screen until the migrations are complete.

Because multiple clients (or tabs) could potentially be migrating simultaneously, we rely upon CouchDB/PouchDB) to
handle conflicts for us. If a conflict occurs, a client will compare the remote and local version. Assuming they are
identical, the client will take the remote version. If they differ (which should be impossible), the client will prompt
the user to resolve the conflict manually.