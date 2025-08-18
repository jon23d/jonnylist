import { useState } from 'react';
import { IconCirclePlus } from '@tabler/icons-react';
import { Button, ButtonProps, Modal, Tooltip } from '@mantine/core';
import { useHotkeys, useViewportSize } from '@mantine/hooks';
import NewTaskForm from '@/components/Layout/NewItem/NewTaskForm';

export default function AddNewItemButton(buttonProps: ButtonProps) {
  const [modalOpened, setModalOpened] = useState(false);
  const { height: viewportHeight, width: viewportWidth } = useViewportSize();

  useHotkeys([['a', () => setModalOpened(true)]]);

  const handleClose = () => {
    setModalOpened(false);
  };

  return (
    <>
      <Tooltip
        label="Press 'a' to quickly add a new task"
        withArrow
        position="bottom"
        openDelay={300}
      >
        <Button
          onClick={() => setModalOpened(true)}
          color="blue"
          {...buttonProps}
          rightSection={<IconCirclePlus size={20} />}
        >
          Add Task
        </Button>
      </Tooltip>

      {modalOpened && (
        <Modal
          opened={modalOpened}
          onClose={handleClose}
          title="Add Task"
          size="lg"
          fullScreen={viewportWidth < 768 || viewportHeight < 500}
        >
          <NewTaskForm handleClose={handleClose} />
        </Modal>
      )}
    </>
  );
}
