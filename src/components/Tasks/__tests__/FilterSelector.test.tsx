import { vi } from 'vitest';
import FilterSelector from '@/components/Tasks/FilterSelector';
import { TaskPriority, TaskStatus } from '@/data/documentTypes/Task';
import { render, screen, userEvent, waitFor, within } from '@/test-utils/index';

describe('FilterSelector', () => {
  const setTaskFilter = vi.fn();

  it('Submits a filter with the tags fields', async () => {
    render(<FilterSelector setTaskFilter={setTaskFilter} />);

    // Show the popover
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    // The tags should be the default  tab
    expect(screen.getByText('Exclude tags')).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText('require tags', { exact: false }), // there is a tooltip that makes it not exact
      'tag1{enter}tag2{enter}'
    );
    await userEvent.type(screen.getByLabelText(/Exclude tags/), 'tag3{enter}tag4{enter}');

    await userEvent.click(screen.getByRole('button', { name: /Apply/ }));

    await waitFor(() => {
      expect(setTaskFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          requireTags: ['tag1', 'tag2'],
          excludeTags: ['tag3', 'tag4'],
        })
      );
    });
  });

  it('Submits a filter with has not tags checked', async () => {
    render(<FilterSelector setTaskFilter={setTaskFilter} />);

    // Show the popover
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    // The tags should be the default  tab
    expect(screen.getByText('Exclude tags')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Has no tags'));

    await userEvent.click(screen.getByRole('button', { name: /Apply/ }));

    await waitFor(() => {
      expect(setTaskFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          hasNoTags: true,
        })
      );
    });
  });

  it('Submits a filter with the required and excluded project fields', async () => {
    render(<FilterSelector setTaskFilter={setTaskFilter} />);

    // Show the popover
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    // Switch to the projects tab
    await userEvent.click(screen.getByRole('tab', { name: 'Projects' }));

    await userEvent.type(
      screen.getByLabelText('Require projects'),
      'project1{enter}project2{enter}'
    );
    await userEvent.type(
      screen.getByLabelText(/Exclude projects/),
      'project3{enter}project4{enter}'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(setTaskFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          requireProjects: ['project1', 'project2'],
          excludeProjects: ['project3', 'project4'],
        })
      );
    });
  });

  it('Submits a filter with has no project checked', async () => {
    render(<FilterSelector setTaskFilter={setTaskFilter} />);

    // Show the popover
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    // Switch to the projects tab
    await userEvent.click(screen.getByRole('tab', { name: 'Projects' }));

    await userEvent.click(screen.getByLabelText('Has no project'));

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(setTaskFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          hasNoProject: true,
        })
      );
    });
  });

  it('Submits a filter with required priorities', async () => {
    render(<FilterSelector setTaskFilter={setTaskFilter} />);

    // Show the popover
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    // Switch to the priority tab
    await userEvent.click(screen.getByRole('tab', { name: 'Priority' }));

    // Get the required priority chip input
    const input = screen.getByLabelText('Require priority');
    await userEvent.click(within(input).getByLabelText('Low'));
    await userEvent.click(within(input).getByLabelText('Medium'));
    await userEvent.click(within(input).getByLabelText('High'));

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(setTaskFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          requirePriority: [TaskPriority.Low, TaskPriority.Medium, TaskPriority.High],
        })
      );
    });
  });

  it('Submits a filter with excluded priorities', async () => {
    render(<FilterSelector setTaskFilter={setTaskFilter} />);

    // Show the popover
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    // Switch to the priority tab
    await userEvent.click(screen.getByRole('tab', { name: 'Priority' }));

    // Get the excluded priority chip input
    const input = screen.getByLabelText('Exclude priority');
    await userEvent.click(within(input).getByLabelText('Low'));
    await userEvent.click(within(input).getByLabelText('Medium'));
    await userEvent.click(within(input).getByLabelText('High'));

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(setTaskFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          excludePriority: [TaskPriority.Low, TaskPriority.Medium, TaskPriority.High],
        })
      );
    });
  });

  it('Does not allow for submitting the same priority as both excluded and required', async () => {
    render(<FilterSelector setTaskFilter={setTaskFilter} />);

    // Show the popover
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    // Switch to the priority tab
    await userEvent.click(screen.getByRole('tab', { name: 'Priority' }));

    // Get the required priority chip input
    screen.debug(undefined, Infinity);
    const requiredInput = screen.getByLabelText('Require priority');
    await userEvent.click(within(requiredInput).getByLabelText('Low'));

    // Now do the same with the excluded priority chip input
    screen.debug(undefined, Infinity);
    const excludedInput = screen.getByLabelText('Exclude priority');
    await userEvent.click(within(excludedInput).getByLabelText('Low'));

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(setTaskFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          requirePriority: [],
          excludePriority: [TaskPriority.Low],
        })
      );
    });
  });

  it('Submits minimum and maximum days from today', async () => {
    render(<FilterSelector setTaskFilter={setTaskFilter} />);

    // Show the popover
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    // Switch to the Due tab
    await userEvent.click(screen.getByRole('tab', { name: 'Dates' }));

    const minInput = screen.getByLabelText('Minimum days from today');
    const maxInput = screen.getByLabelText('Maximum days from today');

    await userEvent.type(minInput, '2');
    await userEvent.type(maxInput, '10');

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(setTaskFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          dueWithin: {
            minimumNumberOfDaysFromToday: 2,
            maximumNumberOfDaysFromToday: 10,
            includeOverdueTasks: false,
          },
        })
      );
    });
  });

  it('Submits include overdue tasks', async () => {
    render(<FilterSelector setTaskFilter={setTaskFilter} />);

    // Show the popover
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    // Switch to the Due tab
    await userEvent.click(screen.getByRole('tab', { name: 'Dates' }));

    const includeOverdueCheckbox = screen.getByLabelText('Include overdue tasks');

    await userEvent.click(includeOverdueCheckbox);

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(setTaskFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          dueWithin: {
            minimumNumberOfDaysFromToday: undefined,
            maximumNumberOfDaysFromToday: undefined,
            includeOverdueTasks: true,
          },
        })
      );
    });
  });
});
