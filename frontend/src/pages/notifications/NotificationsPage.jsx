import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Check,
  Trash2,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const iconMap = {
  success: {
    icon: CheckCircle,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  error: {
    icon: XCircle,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  general: {
    icon: Info,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
};

const NotificationsPage = () => {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    setLoading(true);
    notificationService
      .getAll()
      .then((res) => {
        const list = res?.data || res || [];
        setNotifications(Array.isArray(list) ? list : list.notifications || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification removed.');
    } catch (err) {
      toast.error('Failed to delete notification.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Notifications & Notices</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Campus announcements, academic deadlines, and registration adjudication status.
          </p>
        </div>

        <Button variant="secondary" icon={Check} onClick={handleMarkAllRead}>
          Mark All as Read
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-border">
            <LoadingSpinner message="Checking for new notices..." />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => {
            const conf = iconMap[n.type] || iconMap.info;
            const IconComponent = conf.icon;
            const isUnread = !n.is_read;

            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                  isUnread
                    ? 'bg-white border-blue-200 shadow-xs ring-1 ring-blue-100'
                    : 'bg-white/70 border-border text-text-secondary'
                }`}
              >
                <div className={`p-2.5 rounded-xl border flex-shrink-0 ${conf.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-bold ${isUnread ? 'text-text-dark' : 'text-text-secondary'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[11px] text-text-secondary whitespace-nowrap">
                      {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{n.message}</p>
                </div>

                <div className="flex items-center gap-1.5 self-center">
                  {isUnread && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-slate-100"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50"
                    title="Delete notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-border text-center text-text-secondary text-xs">
            No notifications found. You are completely caught up!
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
