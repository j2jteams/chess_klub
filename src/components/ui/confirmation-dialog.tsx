'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    icon: 'text-red-500',
    confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
    border: 'border-red-200'
  },
  warning: {
    icon: 'text-yellow-500',
    confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    border: 'border-yellow-200'
  },
  info: {
    icon: 'text-blue-500',
    confirmButton: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    border: 'border-blue-200'
  }
};

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Yes',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}: ConfirmationDialogProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    } else {
      // Restore background scrolling
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!isLoading) {
      setIsVisible(false);
      setTimeout(onClose, 150); // Wait for animation
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const styles = variantStyles[variant];

  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm',
        'transition-all duration-300',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className={cn(
          'relative w-full max-w-md mx-auto',
          'bg-background rounded-lg border shadow-lg',
          'transform transition-all duration-300',
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4',
          styles.border
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={cn('flex-shrink-0 mt-1', styles.icon)}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              {title && (
                <h3 
                  id="dialog-title"
                  className="text-lg font-semibold text-foreground mb-2"
                >
                  {title}
                </h3>
              )}
              <p 
                id="dialog-description"
                className="text-sm text-muted-foreground leading-relaxed"
              >
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                'w-full sm:w-auto',
                styles.confirmButton
              )}
            >
              {isLoading ? 'Please wait...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing confirmation dialogs
export function useConfirmationDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    props: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>;
    onConfirm: () => void;
  } | null>(null);

  const showConfirmation = (
    message: string,
    onConfirm: () => void,
    options?: Partial<Omit<ConfirmationDialogProps, 'isOpen' | 'onClose' | 'onConfirm' | 'message'>>
  ) => {
    setDialog({
      isOpen: true,
      props: {
        message,
        title: 'Confirm Action',
        confirmText: 'Yes',
        cancelText: 'Cancel',
        variant: 'danger',
        ...options
      },
      onConfirm
    });
  };

  const hideConfirmation = () => {
    setDialog(null);
  };

  const handleConfirm = () => {
    if (dialog) {
      dialog.onConfirm();
      hideConfirmation();
    }
  };

  // Convenience methods
  const confirmDelete = (itemName: string, onConfirm: () => void) => {
    showConfirmation(
      `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      onConfirm,
      {
        title: 'Delete Confirmation',
        confirmText: 'Delete',
        variant: 'danger'
      }
    );
  };

  const confirmAction = (message: string, onConfirm: () => void, title?: string) => {
    showConfirmation(
      message,
      onConfirm,
      {
        title: title || 'Confirm Action',
        variant: 'info'
      }
    );
  };

  return {
    dialog: dialog ? (
      <ConfirmationDialog
        {...dialog.props}
        isOpen={dialog.isOpen}
        onClose={hideConfirmation}
        onConfirm={handleConfirm}
      />
    ) : null,
    showConfirmation,
    confirmDelete,
    confirmAction,
    hideConfirmation
  };
}