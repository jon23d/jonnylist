import React from 'react';
import ArchivalForm from '@/components/Contexts/Settings/ArchivalForm';
import { Notifications } from '@/helpers/Notifications';
import { fireEvent, render, screen, waitFor } from '@/test-utils';

jest.mock('@/helpers/Notifications', () => ({
  Notifications: {
    showSuccess: jest.fn(),
  },
}));

const mockShowOverlay = jest.fn();
const mockHideOverlay = jest.fn();
jest.mock('@/contexts/BulkOperationOverlayContext', () => ({
  ...jest.requireActual('@/contexts/BulkOperationOverlayContext'),
  useBulkOperationOverlay: () => ({
    opened: false,
    config: { title: '', description: '' },
    showOverlay: mockShowOverlay,
    hideOverlay: mockHideOverlay,
  }),
}));

const mockArchiveContext = jest.fn();
jest.mock('@/contexts/DataSourceContext', () => ({
  useDataSource: () => ({
    archiveContext: mockArchiveContext,
  }),
}));

const onClose = jest.fn();

describe('ArchivalForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders archival form with radio buttons for destination contexts', () => {
    const sourceContext = 'source-context';
    const destinationContexts = ['context1', 'context2', 'context3'];

    render(
      <ArchivalForm
        sourceContext={sourceContext}
        destinationContexts={destinationContexts}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Choose destination context')).toBeInTheDocument();
    destinationContexts.forEach((context) => {
      expect(screen.getByLabelText(context)).toBeInTheDocument();
    });
  });

  it('renders warning alert with correct information', () => {
    const sourceContext = 'source-context';
    const destinationContexts = ['context1', 'context2'];

    render(
      <ArchivalForm
        sourceContext={sourceContext}
        destinationContexts={destinationContexts}
        onClose={onClose}
      />
    );

    expect(
      screen.getByText('All open tasks will be moved to a new context during archival.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Open tasks are those with a status of Ready, Waiting, or Started.')
    ).toBeInTheDocument();
  });

  it('shows confirmation modal on submit', async () => {
    const sourceContext = 'source-context';
    const destinationContexts = ['context1', 'context2'];

    render(
      <ArchivalForm
        sourceContext={sourceContext}
        destinationContexts={destinationContexts}
        onClose={onClose}
      />
    );

    // First select a destination context
    fireEvent.click(screen.getByLabelText('context1'));

    // Then click the Archive button
    fireEvent.click(screen.getByRole('button', { name: /Archive/i }));

    expect(screen.getByText('Archive Context?')).toBeInTheDocument();
    expect(
      screen.getByText(
        `This action cannot be undone. All open tasks in the \`${sourceContext}\` context ` +
          `will be moved to the \`context1\` context, and ` +
          `the \`${sourceContext}\` context will be archived.`
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Archive my context/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('disables archive button when no destination context is selected', () => {
    const sourceContext = 'source-context';
    const destinationContexts = ['context1', 'context2'];

    render(
      <ArchivalForm
        sourceContext={sourceContext}
        destinationContexts={destinationContexts}
        onClose={onClose}
      />
    );

    const archiveButton = screen.getByRole('button', { name: /Archive/i });
    expect(archiveButton).toBeDisabled();
  });

  it('enables archive button when destination context is selected', () => {
    const sourceContext = 'source-context';
    const destinationContexts = ['context1', 'context2'];

    render(
      <ArchivalForm
        sourceContext={sourceContext}
        destinationContexts={destinationContexts}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByLabelText('context1'));

    const archiveButton = screen.getByRole('button', { name: /Archive/i });
    expect(archiveButton).toBeEnabled();
  });

  it('handles form submission with confirmation', async () => {
    const sourceContext = 'source-context';
    const destinationContexts = ['context1', 'context2'];

    (Notifications.showSuccess as jest.Mock).mockImplementation(() => {});

    mockArchiveContext.mockResolvedValueOnce(undefined);

    render(
      <ArchivalForm
        sourceContext={sourceContext}
        destinationContexts={destinationContexts}
        onClose={onClose}
      />
    );

    // Select destination context
    fireEvent.click(screen.getByLabelText('context1'));

    // Click archive button
    fireEvent.click(screen.getByRole('button', { name: /Archive/i }));

    // Confirm in modal
    fireEvent.click(screen.getByRole('button', { name: /Archive my context/i }));

    await waitFor(() => {
      expect(mockShowOverlay).toHaveBeenCalledWith({
        title: 'Archiving Context',
        description: `Hold tight while we archive the ${sourceContext} context.`,
      });
    });

    await waitFor(() => {
      expect(mockArchiveContext).toHaveBeenCalledWith(sourceContext, 'context1');
    });

    await waitFor(() => {
      expect(mockHideOverlay).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(Notifications.showSuccess).toHaveBeenCalledWith({
        title: 'Context Archived',
        message: `Tasks from ${sourceContext} have been moved to context1.`,
      });
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('allows canceling the confirmation modal', () => {
    const sourceContext = 'source-context';
    const destinationContexts = ['context1', 'context2'];

    render(
      <ArchivalForm
        sourceContext={sourceContext}
        destinationContexts={destinationContexts}
        onClose={onClose}
      />
    );

    // Select destination context
    fireEvent.click(screen.getByLabelText('context1'));

    // Click archive button
    fireEvent.click(screen.getByRole('button', { name: /Archive/i }));

    // Cancel in modal
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    // Verify archiveContext was not called
    expect(mockArchiveContext).not.toHaveBeenCalled();
    expect(mockShowOverlay).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles empty destination contexts array', () => {
    const sourceContext = 'source-context';
    const destinationContexts: string[] = [];

    render(
      <ArchivalForm
        sourceContext={sourceContext}
        destinationContexts={destinationContexts}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Choose destination context')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Archive/i })).toBeDisabled();
  });

  it('updates selected destination context when different radio button is clicked', () => {
    const sourceContext = 'source-context';
    const destinationContexts = ['context1', 'context2', 'context3'];

    render(
      <ArchivalForm
        sourceContext={sourceContext}
        destinationContexts={destinationContexts}
        onClose={onClose}
      />
    );

    // Select first context
    fireEvent.click(screen.getByLabelText('context1'));
    expect(screen.getByLabelText('context1')).toBeChecked();

    // Select different context
    fireEvent.click(screen.getByLabelText('context2'));
    expect(screen.getByLabelText('context2')).toBeChecked();
    expect(screen.getByLabelText('context1')).not.toBeChecked();

    // Verify the confirmation modal uses the correct context
    fireEvent.click(screen.getByRole('button', { name: /Archive/i }));
    expect(
      screen.getByText(
        `This action cannot be undone. All open tasks in the \`${sourceContext}\` context ` +
          `will be moved to the \`context2\` context, and ` +
          `the \`${sourceContext}\` context will be archived.`
      )
    ).toBeInTheDocument();
  });
});
