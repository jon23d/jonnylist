import { useMatches } from 'react-router-dom';
import PageTitle from '@/components/Layout/PageTitle';
import { render } from '@/test-utils/index';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useMatches: vi.fn(),
  };
});

const useMatchesMock = vi.mocked(useMatches);

describe('PageTitle', () => {
  it('sets the document title when a route has a title', () => {
    useMatchesMock.mockReturnValue([
      {
        id: '1',
        pathname: '/',
        params: {},
        data: {},
        handle: { title: 'My Test Title' },
        loaderData: {},
      },
    ]);
    render(<PageTitle />);
    expect(document.title).toBe('JonnyList - My Test Title');
  });

  it('sets the document title to the default when a route has no title', () => {
    useMatchesMock.mockReturnValue([
      {
        id: '1',
        pathname: '/',
        params: {},
        data: {},
        handle: {},
        loaderData: {},
      },
    ]);
    render(<PageTitle />);
    expect(document.title).toBe('JonnyList');
  });
});
