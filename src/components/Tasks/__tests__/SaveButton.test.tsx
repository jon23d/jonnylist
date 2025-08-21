import { vi } from 'vitest';
import { SaveButton } from '@/components/Tasks/SaveButton';
import { render, screen, userEvent } from '@/test-utils/index';

describe('SaveButton', () => {
  it('Renders only a single button when isNewTask is false', () => {
    render(<SaveButton handleSaveAndNew={() => {}} isNewTask={false} />);

    const button = screen.getByRole('button', { name: 'Save Task' });

    expect((button as HTMLButtonElement).type).toBe('submit');

    const dropdownButton = screen.queryByRole('button', { name: 'Additional actions' });
    expect(dropdownButton).not.toBeInTheDocument();
  });

  it('Renders the dropdown when isNewTask is true', async () => {
    const mockHandleSaveAndNew = vi.fn();
    render(<SaveButton handleSaveAndNew={mockHandleSaveAndNew} isNewTask />);

    const button = screen.getByRole('button', { name: 'Save Task' });

    expect((button as HTMLButtonElement).type).toBe('submit');

    const dropdownButton = screen.getByRole('button', { name: 'Additional actions' });
    expect(dropdownButton).toBeInTheDocument();

    // Simulate clicking the dropdown button to open the menu
    await userEvent.click(dropdownButton);
    const saveAndNewItem = screen.getByRole('menuitem', { name: 'Save and Create New' });
    expect(saveAndNewItem).toBeInTheDocument();

    await userEvent.click(saveAndNewItem);
    expect(mockHandleSaveAndNew).toHaveBeenCalled();
  });
});
