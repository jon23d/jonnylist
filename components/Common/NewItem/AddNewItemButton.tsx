import React from 'react';
import { Button, Menu, Modal } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import NewListItemForm from '@/components/Common/NewItem/NewListItemForm';
import NewMetricForm from '@/components/Common/NewItem/NewMetricForm';
import NewTaskForm from './NewTaskForm';

export default function AddNewItemButton() {
  const [modalOpened, setModalOpened] = React.useState(false);
  const [newItemComponent, setNewItemComponent] = React.useState(<></>);
  const [newItemModalTitle, setNewItemModalTitle] = React.useState('');
  const [newMenuOpened, setNewMenuOpened] = React.useState(false);

  useHotkeys([['a', () => setNewMenuOpened(true)]]);

  const showForm = (which: string) => {
    switch (which) {
      case 'task':
        setNewItemComponent(<NewTaskForm />);
        setNewItemModalTitle('Add New Task');
        break;
      case 'item':
        setNewItemComponent(<NewListItemForm />);
        setNewItemModalTitle('Add New Item to List');
        break;
      case 'metric':
        setNewItemComponent(<NewMetricForm />);
        setNewItemModalTitle('Add New Metric');
        break;
    }
    setModalOpened(true);
  };

  return (
    <>
      <Menu shadow="xs" opened={newMenuOpened} onChange={setNewMenuOpened}>
        <Menu.Target>
          <Button size="compact-xs">Add New (a)</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={() => showForm('task')}>Task</Menu.Item>
          <Menu.Item onClick={() => showForm('item')}>Item to list</Menu.Item>
          <Menu.Item onClick={() => showForm('metric')}>Metric</Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={newItemModalTitle}>
        {newItemComponent}
      </Modal>
    </>
  );
}
