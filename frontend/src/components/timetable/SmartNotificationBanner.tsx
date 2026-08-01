import React, { useState, useEffect } from 'react';
import { Bell, X, Info, AlertTriangle, CheckCircle, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  isRead: boolean;
  createdAt: string;
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SmartNotificationBanner: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id || !user?.role) return;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/notifications/${user._id}/${user.role}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            // Filter notifications related to timetables, lectures, rooms, schedules or start time
            const filtered = (data.notifications || []).filter((n: AppNotification) => {
              if (n.isRead) return false;
              const text = `${n.title} ${n.message}`.toLowerCase();
              return (
                text.includes('timetable') ||
                text.includes('lecture') ||
                text.includes('schedule') ||
                text.includes('room change') ||
                text.includes('attendance') ||
                text.includes('class start') ||
                text.includes('conflict')
              );
            });
            setNotifications(filtered.slice(0, 3)); // show top 3 alerts max
          }
        }
      } catch (err) {
        console.error('Failed to fetch notifications for banner', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/notifications/read/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user?._id }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  if (loading || notifications.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {notifications.map((n) => {
        let bg = 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
        let icon = <Info className="w-4 h-4 text-blue-500" />;

        if (n.type === 'warning' || n.type === 'danger') {
          bg = 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200';
          icon = <AlertTriangle className="w-4 h-4 text-amber-500" />;
        } else if (n.type === 'success') {
          bg = 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200';
          icon = <CheckCircle className="w-4 h-4 text-emerald-500" />;
        }

        // Highlight conflict alerts extra
        if (n.title.toLowerCase().includes('conflict')) {
          bg = 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
          icon = <AlertTriangle className="w-4 h-4 text-red-500" />;
        }

        return (
          <div
            key={n._id}
            className={`flex items-start justify-between gap-3 p-3.5 border rounded-xl shadow-sm transition-all animate-slide-in-up ${bg}`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">{icon}</div>
              <div>
                <p className="text-xs font-bold flex items-center gap-1.5">
                  {n.title}
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-white/50 dark:bg-black/20 text-[10px] rounded font-semibold text-gray-500 dark:text-gray-400">
                    <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> Live
                  </span>
                </p>
                <p className="text-xs mt-0.5 opacity-90">{n.message}</p>
              </div>
            </div>
            <button
              onClick={() => markAsRead(n._id)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-0.5 rounded-lg hover:bg-black/5 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default SmartNotificationBanner;
