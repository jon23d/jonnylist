import React, { createContext, useContext, useState } from 'react';
import { DataSource } from '@/data/DataSource';
import { LocalDataSource } from '@/data/LocalDatasource';

export type DataSourceContextType = {
  dataSource: DataSource;
};

const DataSourceContext = createContext<DataSourceContextType | null>(null);

export const DataSourceContextProvider = ({
  dataSource,
  children,
}: {
  dataSource?: DataSource;
  children: React.ReactNode;
}) => {
  const [currentDataSource] = useState<DataSource>(dataSource || new LocalDataSource());

  return (
    <DataSourceContext.Provider value={{ dataSource: currentDataSource }}>
      {children}
    </DataSourceContext.Provider>
  );
};

export const useDataSource = () => {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used within a DataSourceContextProvider');
  }
  return context.dataSource;
};
