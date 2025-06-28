import { useState } from 'react';
import { Button, Menu, Modal } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import NewListItemForm from '@/components/Layout/NewItem/NewListItemForm';
import NewMetricForm from '@/components/Layout/NewItem/NewMetricForm';
import NewTaskForm from '@/components/Layout/NewItem/NewTaskForm';

type FormType = 'task' | 'item' | 'metric';

const MODALS = {
  task: {
    title: 'Add New Task',
    component: NewTaskForm,
    menuLabel: 'Task',
  },
  item: {
    title: 'Add New Item to List',
    component: NewListItemForm,
    menuLabel: 'Item to list',
  },
  metric: {
    title: 'Add New Metric',
    component: NewMetricForm,
    menuLabel: 'Metric',
  },
} as const;

export default function AddNewItemButton() {
  const [modalOpened, setModalOpened] = useState(false);
  const [activeFormType, setActiveFormType] = useState<FormType | null>(null);
  const [newMenuOpened, setNewMenuOpened] = useState(false);

  useHotkeys([['a', () => setNewMenuOpened(true)]]);

  const showForm = (formType: FormType) => {
    setActiveFormType(formType);
    setModalOpened(true);
  };

  const handleClose = () => {
    setModalOpened(false);
    setActiveFormType(null);
  };

  const renderForm = () => {
    if (!activeFormType) {
      return null;
    }

    const FormComponent = MODALS[activeFormType].component;
    const props = { handleClose };

    return <FormComponent {...props} />;
  };

  return (
    <>
      <Menu shadow="xs" opened={newMenuOpened} onChange={setNewMenuOpened}>
        <Menu.Target>
          <Button size="compact-xs">Add New (a)</Button>
        </Menu.Target>
        <Menu.Dropdown>
          {Object.entries(MODALS).map(([key, config]) => (
            <Menu.Item key={key} onClick={() => showForm(key as FormType)}>
              {config.menuLabel}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>

      <Modal
        opened={modalOpened}
        onClose={handleClose}
        title={activeFormType ? MODALS[activeFormType].title : ''}
      >
        {renderForm()}
      </Modal>
    </>
  );
}
