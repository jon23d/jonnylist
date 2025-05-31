import { ViewProps } from '@/components/Contexts/Views/viewProps';

export default function Calendar(viewProps: ViewProps) {
  return (
    <div>
      <h1>Calendar View</h1>
      <p>This is the calendar view component.</p>
      {viewProps.tasks.map((task, index) => (
        <div key={index} className="task-card">
          <h2>{task.title}</h2>
          <p>{task.description}</p>
          <p>Status: {task.status}</p>
          <p>Due Date: {task.dueDate ? task.dueDate.toLocaleDateString() : 'No due date'}</p>
        </div>
      ))}
    </div>
  );
}
