import React, { createContext, ReactNode, useContext, useState } from 'react';

interface OverlayConfig {
  title: string;
  description: string;
}

interface BulkOperationOverlayContextType {
  opened: boolean;
  config: OverlayConfig;
  showOverlay: (config: OverlayConfig) => void;
  hideOverlay: () => Promise<void>;
}

const BulkOperationOverlayContext = createContext<BulkOperationOverlayContextType | undefined>(
  undefined
);

// To avoid flashing, we ensure the overlay is displayed for at least a minimum time
const MINIMUM_DISPLAY_TIME = 2000;

export function BulkOperationOverlayProvider({ children }: { children: ReactNode }) {
  const [opened, setOpened] = useState(false);
  const [config, setConfig] = useState<OverlayConfig>({
    title: '',
    description: '',
  });
  const [openTime, setOpenTime] = useState<number | null>(null);

  const showOverlay = (overlayConfig: OverlayConfig) => {
    setConfig(overlayConfig);
    setOpened(true);
    setOpenTime(Date.now());
  };

  const hideOverlay = (): Promise<void> => {
    return new Promise((resolve) => {
      // Ensure the overlay is shown for at least a given minimum time
      const elapsedTime = Date.now() - (openTime || Date.now());
      if (elapsedTime < MINIMUM_DISPLAY_TIME) {
        setTimeout(() => {
          _closeOverlay();
          resolve();
        }, MINIMUM_DISPLAY_TIME - elapsedTime);
        return;
      }
      _closeOverlay();
      resolve();
    });
  };

  const _closeOverlay = () => {
    setOpened(false);
    setConfig({ title: '', description: '' });
    setOpenTime(null);
  };

  return (
    <BulkOperationOverlayContext.Provider value={{ opened, config, showOverlay, hideOverlay }}>
      {children}
    </BulkOperationOverlayContext.Provider>
  );
}

export function useBulkOperationOverlay() {
  const context = useContext(BulkOperationOverlayContext);
  if (context === undefined) {
    throw new Error('useBulkOperationOverlay must be used within a BulkOperationOverlayProvider');
  }
  return context;
}
