import { Button, Paper, Typography } from '@mantine/core';

export default function Intro({ toggleIntro }: { toggleIntro: () => void }) {
  return (
    <Paper shadow="md" withBorder p={20} mb={15}>
      <Typography>
        <h1>JonnyList!</h1>
        <p>
          JonnyList is a task management application designed to fill the gaps in available
          offerings. It is is designed to help you maintain a high level of productivity by:
        </p>
        <ol>
          <li>Allowing you to capture tasks quickly and easily</li>
          <li>Organizing tasks into projects and contexts</li>
          <li>Automatically prioritizing tasks based on information you provide</li>
        </ol>
        <h2>Contexts</h2>
        <p>
          Contexts allow you to group tasks by location, tool, or situation. For example, you might
          have contexts for "Home", "Work", "Errands", or "Computer". You can then filter your task
          list by context to see only the tasks that are relevant to your current situation, then
          save your filters as a context for easy access later.
        </p>
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
