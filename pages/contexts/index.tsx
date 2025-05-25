import { useRouter } from 'next/router';
import { SimpleGrid } from '@mantine/core';
import ContextPage from '@/components/Contexts/ContextPage';
import ContextSummaryCard from '@/components/Contexts/ContextSummaryCard';

export default function Page() {
  const router = useRouter();
  const query = router.query;

  if (query.context) {
    const contextName = query.context;
    return <ContextPage contextName={contextName as string} />;
  }

  const contexts = ['home', 'work'];

  return (
    <>
      <h1>Contexts</h1>
      <p>
        Contexts represent a location where you want to perform tasks, such as 'home, 'work', or
        'grocery store'.
      </p>
      <p>
        Contexts are used to group tasks that are relevant to a specific location. For example, you
        might have a list of tasks to do at home, another list for work, and another list for the
        grocery store.
      </p>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {contexts.map((context) => (
          <ContextSummaryCard contextName={context} />
        ))}
      </SimpleGrid>
    </>
  );
}
