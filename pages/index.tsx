import { Title } from '@mantine/core';

export default function Page() {
  return (
    <>
      <Title order={1}>Welcome to JonnyList!</Title>
      JonnyList is a task management application designed to fill the gaps in available offerings.
      <Title order={2}>Keyboard shortcuts</Title>
      <ul>
        <li>
          <strong>Ctrl + K</strong> or <strong>Cmd + K</strong>: Open command palette
        </li>
        <li>
          <strong>a</strong>: Add a new task
        </li>
      </ul>
    </>
  );
}
