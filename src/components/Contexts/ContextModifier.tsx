import React from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import { Menu, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import DeleteContextForm from '@/components/Contexts/DeleteContextForm';
import RenameContextForm from '@/components/Contexts/RenameContextForm';
import { Context } from '@/data/documentTypes/Context';

export default function ContextModifier({
  context,
  visible,
}: {
  context: Context;
  visible: boolean;
}) {
  const [renameOpened, { open: openRename, close: closeRename }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  return (
    <>
      <Menu shadow="md">
        <Menu.Target>
          <IconDotsVertical size={16} opacity={visible ? 100 : 0} />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={openRename}>Rename</Menu.Item>
          <Menu.Item onClick={openDelete}>Delete</Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <Modal opened={renameOpened} onClose={closeRename} title="Rename Context">
        <RenameContextForm context={context} onClose={closeRename} />
      </Modal>
      <Modal opened={deleteOpened} onClose={closeDelete} title="Delete Context">
        <DeleteContextForm context={context} onClose={closeDelete} />
      </Modal>
    </>
  );
}
