import ContextLayout from '@/components/Layout/ContextLayout';
import useRouterReady from '@/hooks/UseRouterReady';

export default function Page() {
  const { isReady, query } = useRouterReady();
  const contextName = query.context;

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return (
    <ContextLayout>
      <h1>Contexts</h1>
      You are in the {contextName} context.
    </ContextLayout>
  );
}
