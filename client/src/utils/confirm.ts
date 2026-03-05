import { useState } from 'react';

// Promise-based confirmation dialog
export const confirm = (options: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}): Promise<boolean> => {
  return new Promise((resolve) => {
    // Create a custom confirm dialog using window.confirm as fallback
    // In production, you would use a proper modal component
    const result = window.confirm(`${options.title}\n\n${options.message}`);
    resolve(result);
  });
};

// Hook for using confirmation dialog in components
export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  } | null>(null);

  const confirmWithHook = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'warning'
  ) => {
    setConfig({ title, message, onConfirm, type });
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (config) {
      config.onConfirm();
    }
    setIsOpen(false);
    setConfig(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setConfig(null);
  };

  return {
    confirm: confirmWithHook,
    isOpen,
    config,
    handleConfirm,
    handleCancel,
  };
};

