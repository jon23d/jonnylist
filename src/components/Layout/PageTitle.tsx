import { useEffect } from 'react';
import { useMatches } from 'react-router-dom';

type Handle = {
  title?: string;
};

const PageTitle = () => {
  const matches = useMatches();

  useEffect(() => {
    const lastMatch = matches[matches.length - 1];
    const handle = lastMatch?.handle as Handle | undefined;
    const title = handle?.title;

    if (title) {
      document.title = `JonnyList - ${title}`;
    } else {
      document.title = 'JonnyList';
    }
  }, [matches]);

  return null;
};

export default PageTitle;
