# JonnyList

JonnyList is an open-source application that allows for the creation and management of:

* Tasks
* Lists
* Trackers

## Tasks

Tasks are items that need to be done! They belong to a [context](#contexts) and have additional optional properties such
as: a due date, a priority, a description, and tags. Tasks have statuses such as "ready", "started", and "done".

## Lists
Lists are simple checkbox lists that can be used to track items. They are meant for shopping lists, errands, or any
context-sensitive less-complex list of items.

## Trackers
Trackers are lists of items that can be tracked over time. They are meant for tracking habits, measurables, or...

## Contexts
Contexts are used to group tasks. They represent a situation in which tasks are performed. For example, some contexts
could be "work", "home", "office".

# Installation

This project uses [Yarn](https://yarnpkg.com/) as a package manager.

1. Clone the repository:
   ```bash
    git clone git@github.com:jon23d/jonnylist.git
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```

## Scripts
```bash
 yarn dev
```
This will start the development server on `http://localhost:3000`. Changes to the code are automatically reflected
in the browser.

```bash
 yarn test
```
This will run the tests using Jest. It will also check for TypeScript types, run ESLint, and check Prettier formatting.

```bash
 yarn serve
```
This will build the application for production and start a server to serve the built application
on `http://localhost:3000`. This is useful for testing the production build locally.

```bash
 yarn build
```
This will build the application for production. The built application will be in the `out` folder.
   
# Technology stack
This project is built using the following technologies:
* [Next.js](https://nextjs.org/) - a React framework for building server-rendered applications
* [React](https://reactjs.org/) - a JavaScript library for building user interfaces
* [TypeScript](https://www.typescriptlang.org/) - a typed superset of JavaScript that compiles to plain JavaScript
* [Mantine](https://mantine.dev/) - a React component library with a focus on usability and accessibility
* [PouchDB](https://pouchdb.com/) - a JavaScript database that syncs with CouchDB and other compatible servers
* [Jest](https://jestjs.io/) - a JavaScript testing framework
* [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) - a library for testing React components

# Additional documentation

* [Database architecture](docs/database-architecture.md)

# Contributing
Contributions are welcome! If you have any ideas, suggestions, or issues, please open an issue or a pull request on
the [JonnyList GitHub repository](https://github.com/jon23d/jonnylist).

# License
Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International

This license requires that reusers give credit to the creator. It allows reusers to distribute, remix, adapt, and build
upon the material in any medium or format, for noncommercial purposes only. If others modify or adapt the material,
they must license the modified material under identical terms.

See [LICENSE](LICENSE) for more details.

