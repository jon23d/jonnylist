import { Anchor, List, Paper, Title } from '@mantine/core';


export default function StartedTasksWidget() {
  return <Paper shadow="smw" radius="md" withBorder p="lg">
    <Title order={3}>Started tasks</Title>
    <List>
      <List.Item>
        <Anchor>
          Do not update status in form when waitUntil is present. Let taskrepo take care of it
        </Anchor>
      </List.Item>
      <List.Item>
        <Anchor>Refreshes result in a 404</Anchor>
      </List.Item>
      <List.Item>
        <Anchor>Move to vite</Anchor>
      </List.Item>
    </List>
  </Paper>;
}