import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface UseRouterReadyResult {
  isReady: boolean;
  query: ReturnType<typeof useRouter>['query'];
  router: ReturnType<typeof useRouter>;
}

function useRouterReady(): UseRouterReadyResult {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      setIsReady(true);
    }
  }, [router.isReady]);

  return {
    isReady,
    query: router.query,
    router,
  };
}

export default useRouterReady;
