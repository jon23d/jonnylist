export default function ContextPage({ contextName }: { contextName: string }) {
  return (
    <>
      <h1>Contexts</h1>
      You are in the {contextName} context.
    </>
  );
}
