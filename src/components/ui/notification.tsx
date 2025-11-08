'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number; // milliseconds, 0 means no auto-dismiss
  onDismiss?: () => void;
  className?: string;
}

const notificationIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const notificationStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconStyles = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

export function Notification({
  type,
  title,
  message,
  duration = 5000,
  onDismiss,
  className
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = notificationIcons[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-sm transition-all duration-300',
        notificationStyles[type],
        className
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconStyles[type])} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-medium mb-1">{title}</h4>
        )}
        <p className="text-sm">{message}</p>
      </div>
      
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Notification Container for managing multiple notifications
interface NotificationContainerProps {
  notifications: Array<NotificationProps & { id: string }>;
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
};

export function NotificationContainer({ 
  notifications, 
  onDismiss, 
  position = 'top-right' 
}: NotificationContainerProps) {
  return (
    <div className={cn(
      'fixed z-50 max-w-sm w-full space-y-2',
      positionStyles[position]
    )}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onDismiss={() => onDismiss(notification.id)}
        />
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Array<NotificationProps & { id: string }>>([]);

  const addNotification = useCallback((notification: Omit<NotificationProps, 'onDismiss'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, title?: string, options?: Partial<NotificationProps>) => {
    addNotification({ type: 'success', message, title, ...options });
  }, [addNotification]);

  const showError = useCallback((message: string, title?: string, options?: Partial<NotificationProps>) => {
    addNotification({ type: 'error', message, title, ...options });
  }, [addNotification]);

  const showWarning = useCallback((message: string, title?: string, options?: Partial<NotificationProps>) => {
    addNotification({ type: 'warning', message, title, ...options });
  }, [addNotification]);

  const showInfo = useCallback((message: string, title?: string, options?: Partial<NotificationProps>) => {
    addNotification({ type: 'info', message, title, ...options });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}