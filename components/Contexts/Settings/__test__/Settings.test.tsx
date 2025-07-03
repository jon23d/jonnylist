import React from 'react';
import Settings from '@/components/Contexts/Settings/Settings';
import { renderWithDataSource, screen } from '@/test-utils';
import { setupTestDatabase } from '@/test-utils/db';

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
  const { getDataSource } = setupTestDatabase();

  it('renders both RenameForm and ArchivalForm', async () => {
    const dataSource = getDataSource();
    const contextRepository = dataSource.getContextRepository();

    const contextNames = ['context1', 'context2', 'context3'];
    await Promise.all(contextNames.map((name) => contextRepository.addContext(name)));

    renderWithDataSource(<Settings contextName="context1" onClose={onClose} />, dataSource);

    expect(screen.getByText('Rename context')).toBeInTheDocument();
    expect(screen.getByTestId('rename-form')).toBeInTheDocument();
  });

  it('passes correct props to RenameForm', async () => {
    const dataSource = getDataSource();
    const contextRepository = dataSource.getContextRepository();

    const contextNames = ['test-context'];
    await Promise.all(contextNames.map((name) => contextRepository.addContext(name)));

    renderWithDataSource(<Settings contextName="test-context" onClose={onClose} />, dataSource);

    expect(screen.getByTestId('context-name')).toHaveTextContent('test-context');
  });
});
