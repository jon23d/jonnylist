import { Button, Paper, Typography } from '@mantine/core';

export default function Intro({ toggleIntro }: { toggleIntro: () => void }) {
  return (
    <Paper shadow="md" withBorder p={20} mb={15}>
      <Typography>
        <p>
          JonnyList is a task management application designed to fill the gaps in available
          offerings. It is is designed to help you maintain a high level of productivity by:
        </p>
        <ol>
          <li>Allowing you to capture tasks quickly and easily</li>
          <li>Organizing tasks into projects and contexts</li>
          <li>Automatically prioritizing tasks based on information you provide</li>
        </ol>
        <h2>Keyboard Shortcuts</h2>
        <ul>
          <li>
            <strong>Ctrl + K</strong> or <strong>Cmd + K</strong>: Open command palette
          </li>
          <li>
            <strong>a</strong>: Add a new task
          </li>
        </ul>
      </Typography>
      <Button onClick={toggleIntro}>Hide</Button>
    </Paper>
  );
}
