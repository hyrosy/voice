import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from "@/lib/utils";

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
}

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000); // Auto-dismiss after 5 seconds
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-6 h-6 text-green-500" />,
    error: <XCircle className="w-6 h-6 text-red-500" />,
    info: <Info className="w-6 h-6 text-blue-500" />,
  };

  const bgColors = {
    success: "bg-green-50/90 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    error: "bg-red-50/90 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    info: "bg-blue-50/90 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
  };

  return (
    <div className={cn(
      "pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all animate-in slide-in-from-right-full duration-300",
      bgColors[notification.type],
      "backdrop-blur-sm"
    )}>
      <div className="p-4 flex items-start gap-4 w-full">
        <div className="shrink-0 mt-0.5">{icons[notification.type]}</div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-bold text-foreground">{notification.title}</p>
          {notification.message && (
            <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
          )}
        </div>
        <button 
          onClick={() => onClose(notification.id)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export const NotificationContainer: React.FC<{ notifications: Notification[], removeNotification: (id: string) => void }> = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {notifications.map(n => (
        <NotificationToast key={n.id} notification={n} onClose={removeNotification} />
      ))}
    </div>
  );
};