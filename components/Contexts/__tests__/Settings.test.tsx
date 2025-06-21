import React from 'react';
import Settings from '@/components/Contexts/Settings/Settings';
import { DocumentTypes } from '@/data/documentTypes';
import { LocalDataSource } from '@/data/LocalDataSource';
import { renderWithDatasource, screen, waitFor } from '@/test-utils';
import { createTestLocalDataSource } from '@/test-utils/db';

// Mock the child components
jest.mock('@/components/Contexts/Settings/ArchivalForm', () => {
  return function MockArchivalForm({
    sourceContext,
    destinationContexts,
    onClose,
  }: {
    sourceContext: string;
    destinationContexts: string[];
    onClose: () => void;
  }) {
    return (
      <div data-testid="archival-form">
        <div data-testid="source-context">{sourceContext}</div>
        <div data-testid="destination-contexts">
          {destinationContexts.map((context, index) => (
            <div key={index} data-testid={`destination-${context}`}>
              {context}
            </div>
          ))}
        </div>
        <button type="button" onClick={onClose}>
          Close Archival
        </button>
      </div>
    );
  };
});

jest.mock('@/components/Contexts/Settings/RenameForm', () => {
  return function MockRenameForm({
    contextName,
    onClose,
  }: {
    contextName: string;
    onClose: () => void;
  }) {
    return (
      <div data-testid="rename-form">
        <div data-testid="context-name">{contextName}</div>
        <button onClick={onClose} type="button">
          Close Rename
        </button>
      </div>
    );
  };
});

const onClose = jest.fn();

describe('Settings', () => {
  let dataSource: LocalDataSource;
  let db: PouchDB.Database<DocumentTypes>;

  beforeEach(() => {
    const testData = createTestLocalDataSource();
    dataSource = testData.dataSource;
    db = testData.database;
  });

  afterEach(async () => {
    await dataSource.cleanup();
    await db.destroy();
  });

  it('renders both RenameForm and ArchivalForm', async () => {
    const contextNames = ['context1', 'context2', 'context3'];
    await Promise.all(contextNames.map((name) => dataSource.addContext(name)));

    renderWithDatasource(<Settings contextName="context1" onClose={onClose} />, dataSource);

    expect(screen.getByText('Rename context')).toBeInTheDocument();
    expect(screen.getByTestId('rename-form')).toBeInTheDocument();

    expect(screen.getByText('Archive context')).toBeInTheDocument();
    expect(screen.getByTestId('archival-form')).toBeInTheDocument();
  });

  it('passes correct props to RenameForm', async () => {
    const contextNames = ['test-context'];
    await Promise.all(contextNames.map((name) => dataSource.addContext(name)));

    renderWithDatasource(<Settings contextName="test-context" onClose={onClose} />, dataSource);

    expect(screen.getByTestId('context-name')).toHaveTextContent('test-context');
  });

  it('fetches contexts and filters out current context for ArchivalForm', async () => {
    const contextNames = ['context1', 'context2', 'context3'];
    await Promise.all(contextNames.map((name) => dataSource.addContext(name)));

    renderWithDatasource(<Settings contextName="context2" onClose={onClose} />, dataSource);

    // Should pass the current context as sourceContext
    expect(screen.getByTestId('source-context')).toHaveTextContent('context2');

    // Should pass other contexts as destination options (excluding current context)
    await waitFor(() => {
      expect(screen.getByTestId('destination-context1')).toHaveTextContent('context1');
      expect(screen.getByTestId('destination-context3')).toHaveTextContent('context3');
    });

    // Should not include the current context in destination options
    expect(screen.queryByTestId('destination-context2')).not.toBeInTheDocument();
  });
});
