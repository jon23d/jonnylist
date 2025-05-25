import ContextLayout from '@/components/Layout/ContextLayout';

export default function ContextPage({ contextName }: { contextName: string }) {
  return (
    <ContextLayout>
      <h1>Contexts</h1>
      You are in the {contextName} context.
    </ContextLayout>
  );
}
