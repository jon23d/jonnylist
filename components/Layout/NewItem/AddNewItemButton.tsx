import { useState } from 'react';
import { Button, Modal } from '@mantine/core';
import { useHotkeys, useViewportSize } from '@mantine/hooks';
import NewTaskForm from '@/components/Layout/NewItem/NewTaskForm';

export default function AddNewItemButton() {
  const [modalOpened, setModalOpened] = useState(false);
  const { height: viewportHeight, width: viewportWidth } = useViewportSize();

  useHotkeys([['a', () => setModalOpened(true)]]);

  const handleClose = () => {
    setModalOpened(false);
  };

  return (
    <>
      <Button size="compact-xs" onClick={() => setModalOpened(true)} key="a">
        Add Task (a)
      </Button>

      <Modal
        opened={modalOpened}
        onClose={handleClose}
        title="Add Task"
        size="lg"
        fullScreen={viewportWidth < 768 || viewportHeight < 500}
      >
        <NewTaskForm handleClose={handleClose} />
      </Modal>
    </>
  );
}
