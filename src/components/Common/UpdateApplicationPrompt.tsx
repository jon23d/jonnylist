import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button, Group, Modal, Text } from '@mantine/core';
import { Logger } from '@/helpers/Logger';

const REPROMPT_INTERVAL = 60 * 60 * 1000; // 1 hour
const CHECK_FOR_UPDATES_INTERVAL = 10 * 60 * 1000; // 10 minutes

export default function UpdateApplicationPrompt() {
  const {
    // This allows us to manually specify that a new version is available
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // This will fire the very first time the service worker detects an update, and
        // only the very first time. It won't happen again until the window is closed and
        // reopened, even if there are subsequent updates.
        if (r.waiting) {
          Logger.info('Update detected on initial registration');
          setNeedRefresh(true);
        }

        // We are going to continue to check for updates once every ten minutes
        setInterval(async () => {
          Logger.info('Checking for service worker updates');
          await r.update();
          if (r.waiting) {
            setNeedRefresh(true);
          }
        }, CHECK_FOR_UPDATES_INTERVAL); // Check every 7 seconds
      }
    },
  });

  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Show the modal when an update is available on initial load
  useEffect(() => {
    if (needRefresh) {
      setVisible(true);
    }
  }, [needRefresh]);

  // Re-show the modal if a user dismisses it every hour
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (needRefresh && !visible) {
      intervalId = setInterval(() => {
        setVisible(true);
      }, REPROMPT_INTERVAL);
    }
    return () => clearInterval(intervalId);
  }, [needRefresh, visible]);

  const closeModal = () => {
    setVisible(false);
  };

  const doUpdate = () => {
    setUpdating(true);
    updateServiceWorker(true);
  };

  return (
    <Modal opened={visible} onClose={closeModal} title="Update Available!" centered>
      <Text mb="md">A new version of the application is available. Update now?</Text>
      <Text c="dimmed">
        Please make sure you have saved all of your work before pressing update.
      </Text>
      <Group justify="flex-end">
        <Button variant="outline" onClick={closeModal} disabled={updating}>
          Not Now
        </Button>
        <Button onClick={doUpdate} disabled={updating}>
          {updating ? 'Updating...' : 'Update'}
        </Button>
      </Group>
    </Modal>
  );
}
