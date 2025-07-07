import { useState } from 'react';
import { Button, Modal } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import NewTaskForm from '@/components/Layout/NewItem/NewTaskForm';

export default function AddNewItemButton() {
  const [modalOpened, setModalOpened] = useState(false);

  useHotkeys([['a', () => setModalOpened(true)]]);

  const handleClose = () => {
    setModalOpened(false);
  };

  return (
    <>
      <Button size="compact-xs" onClick={() => setModalOpened(true)} key="a">
        Add Task (a)
      </Button>

      <Modal opened={modalOpened} onClose={handleClose} title="Add Task" size="lg">
        <NewTaskForm handleClose={handleClose} />
      </Modal>
    </>
  );
}
