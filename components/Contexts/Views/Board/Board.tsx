import { ViewProps } from '@/components/Contexts/Views/viewProps';

export default function Board(viewProps: ViewProps) {
  return (
    <div>
      <h1>Board View</h1>
      <p>This is the board view of your application.</p>
      {viewProps.tasks.map((task) => (
        <div key={task._id} className="task-card">
          <h2>{task.title}</h2>
          <p>{task.description}</p>
          <p>Status: {task.status}</p>
          <p>Due Date: {task.dueDate ?? 'No due date'}</p>
        </div>
      ))}
    </div>
  );
}
