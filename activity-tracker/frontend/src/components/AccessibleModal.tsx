import React, { useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AccessibleButton } from './AccessibleButton';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
}) => {
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  // Trap focus within modal when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <Dialog
      open={isOpen}
      onClose={closeOnOverlayClick ? onClose : () => {}}
      className="relative z-50"
      initialFocus={initialFocusRef}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`mx-auto ${sizeClasses[size]} w-full bg-white rounded-lg shadow-xl`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title
              id="modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </Dialog.Title>
            <AccessibleButton
              ref={initialFocusRef}
              variant="ghost"
              size="sm"
              onClick={onClose}
              ariaLabel="Close modal"
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </AccessibleButton>
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
