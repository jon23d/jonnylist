export default function Page({ taskId }: { taskId: string }) {
  return (
    <>
      <h1>Task Details</h1>
      <p>Task ID: {taskId}</p>
      {/* Here you would typically fetch and display task details based on taskId */}
    </>
  );
}
