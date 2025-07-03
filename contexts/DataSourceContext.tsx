import React, { createContext, useContext, useEffect, useState } from 'react';
import PouchDB from 'pouchdb';
import { ContextRepository } from '@/data/ContextRepository';
import { DataSource } from '@/data/DataSource';
import { DocumentTypes } from '@/data/documentTypes';
import { TaskRepository } from '@/data/TaskRepository';
import { Logger } from '@/helpers/Logger';
import { Notifications } from '@/helpers/Notifications';

export type DataSourceContextType = {
  dataSource: DataSource;
  isMigrating: boolean;
};

const DataSourceContext = createContext<DataSourceContextType | null>(null);

export const DataSourceContextProvider = ({
  dataSource,
  children,
}: {
  dataSource?: DataSource;
  children: React.ReactNode;
}) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [currentDataSource] = useState<DataSource>(
    // Use the provided dataSource if it exists, otherwise create a new one
    () =>
      dataSource ||
      new DataSource(new PouchDB<DocumentTypes>('jonnylist', { auto_compaction: true }))
  );

  useEffect(() => {
    currentDataSource.onMigrationStatusChange = setIsMigrating;

    // Run migrations when the application starts
    currentDataSource.runMigrations().catch((error) => {
      Logger.error('Failed to run migrations:', error);
    });

    // Initialize syncing if the data source supports it
    currentDataSource.initializeSync().catch((error) => {
      Logger.error('Failed to initialize syncing:', error);
      Notifications.showError({
        title: 'Sync Initialization Error',
        message: 'Failed to initialize data source syncing. Please check your configuration.',
      });
    });

    // Cleanup function
    return () => {
      currentDataSource.cleanup().catch((error) => {
        Logger.error('Failed to cleanup DataSource:', error);
      });
    };
  }, [currentDataSource]);

  return (
    <DataSourceContext.Provider value={{ dataSource: currentDataSource, isMigrating }}>
      {children}
    </DataSourceContext.Provider>
  );
};

export const useDataSource = (): DataSource => {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used within a DataSourceContextProvider');
  }
  return context.dataSource;
};

export const useIsMigrating = (): boolean => {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useIsMigrating must be used within a DataSourceContextProvider');
  }
  return context.isMigrating;
};

export const useTaskRepository = (): TaskRepository => {
  const dataSource = useDataSource();
  return dataSource.getTaskRepository();
};

export const useContextRepository = (): ContextRepository => {
  const dataSource = useDataSource();
  return dataSource.getContextRepository();
};
