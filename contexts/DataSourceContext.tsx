import React, { createContext, useContext, useEffect, useState } from 'react';
import { DataSource } from '@/data/DataSource';
import { LocalDataSource } from '@/data/LocalDataSource';

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
  const [currentDataSource] = useState<DataSource>(dataSource || new LocalDataSource());

  useEffect(() => {
    currentDataSource.onMigrationStatusChange = setIsMigrating;
  }, []);

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
