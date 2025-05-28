import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ContextPage from '@/components/Contexts/ContextPage';

export default function Page() {
  const router = useRouter();
  // Destructure name directly from query for cleaner dependencies and handling
  const { name: contextNameInQuery } = router.query;

  // Initialize contextName state, perhaps to null or undefined to indicate loading
  const [contextName, setContextName] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) {
      return; // Wait for the router to be fully initialized
    }

    if (typeof contextNameInQuery === 'string') {
      setContextName(contextNameInQuery);
    } else {
      // Missing required parameter, redirect to contexts page
      router.push('/contexts');
    }
  }, [router.isReady, contextNameInQuery, router]);

  if (contextName === null || !router.isReady) {
    return (
      <>
        <Head>
          <title>Loading... | JonnyList</title>
        </Head>
        <div>Loading context information...</div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{contextName} context | JonnyList</title>
      </Head>
      {/* Pass the determined and validated contextName state to the component */}
      <ContextPage contextName={contextName} />
    </>
  );
}
