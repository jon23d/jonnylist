import BulkOperationOverlay from '@/components/Common/BulkOperationOverlay';
import { render, screen } from '@/test-utils/index';

describe('BulkOperationOverlay', () => {
  it('Renders with the title and description', () => {
    render(<BulkOperationOverlay title="A title" description="A description" />);

    expect(screen.getByText('A title')).toBeInTheDocument();
    expect(screen.getByText('A description')).toBeInTheDocument();
  });
});
