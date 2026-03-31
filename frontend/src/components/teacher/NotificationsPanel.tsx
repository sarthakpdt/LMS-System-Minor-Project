import { useState, useEffect } from 'react';
import {
  Bell, Plus, CheckCheck, Trash2, Loader2, AlertCircle,
  Info, AlertTriangle, CheckCircle, X
} from 'lucide-react';

const API = 'http://localhost:5000/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetRole: string;
  createdByName: string;
  isRead: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Props {
  userId?: string;
  role?: string;
  userName?: string;
  isAdmin?: boolean;
}

const TYPE_CONFIG = {
  info:    { icon: Info,          bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-50', border: 'border-yellow-200',text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
  success: { icon: CheckCircle,   bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  badge: 'bg-green-100 text-green-700' },
  error:   { icon: AlertCircle,   bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    badge: 'bg-red-100 text-red-700' },
};

export default function NotificationsPanel({ userId, role, userName, isAdmin }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info' as Notification['type'],
    targetRole: role === 'teacher' ? 'student' : 'all',
  });
  const [posting, setPosting] = useState(false);

  const canCreate = role === 'admin' || role === 'teacher';

  // ── Safe fetch — waits until userId is available ──────────────
  const fetchNotifications = async (uid: string, r: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/notifications/${uid}/${r}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications || []);
      } else {
        setError(json.message || 'Could not load notifications.');
      }
    } catch {
      setError('Network error. Is the backend running at localhost:5000?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when both userId and role are ready
    if (userId && role) {
      fetchNotifications(userId, role);
    } else {
      // userId not ready yet — wait a moment and retry
      const timer = setTimeout(() => {
        if (userId && role) fetchNotifications(userId, role);
        else setLoading(false); // give up gracefully
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [userId, role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setError('Title and message are required.');
      return;
    }
    if (!userId) { setError('Session error. Please refresh.'); return; }

    setPosting(true);
    setError('');
    try {
      const res = await fetch(`${API}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          createdBy: userId,
          createdByName: userName || role || 'Unknown',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setForm({ title: '', message: '', type: 'info', targetRole: role === 'teacher' ? 'student' : 'all' });
        setShowForm(false);
        if (userId && role) fetchNotifications(userId, role);
      } else {
        setError(json.message || 'Failed to send notification.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const markRead = async (notifId: string) => {
    if (!userId) return;
    try {
      await fetch(`${API}/notifications/read/${notifId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    if (!userId || !role) return;
    try {
      await fetch(`${API}/notifications/readall/${userId}/${role}`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const deleteNotif = async (notifId: string) => {
    try {
      await fetch(`${API}/notifications/${notifId}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n._id !== notifId));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-500" /> Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => { setShowForm(!showForm); setError(''); }}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Cancel' : 'New Notification'}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Debug info if userId missing */}
      {!userId && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm">
          ⚠️ User session not detected. Please refresh the page or log out and log in again.
        </div>
      )}

      {/* Create Form */}
      {showForm && canCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" />
            Send {role === 'teacher' ? 'Student ' : ''}Notification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Notification title"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="info">ℹ️ Info</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="success">✅ Success</option>
                  <option value="error">🚨 Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Send To</label>
                <select
                  value={form.targetRole}
                  onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {role === 'admin' && <option value="all">Everyone</option>}
                  <option value="student">Students</option>
                  {role === 'admin' && <option value="teacher">Teachers</option>}
                  {role === 'admin' && <option value="admin">Admins</option>}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
            <textarea
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Write your notification message here…"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={posting}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-medium transition"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              {posting ? 'Sending…' : 'Send Notification'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-14 text-center text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No notifications yet</p>
            {canCreate && <p className="text-xs mt-1">Click "New Notification" to send one to your students.</p>}
          </div>
        ) : (
          notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <div
                key={n._id}
                onClick={() => { if (!n.isRead) markRead(n._id); }}
                className={`relative flex items-start gap-3 px-4 py-4 rounded-xl border cursor-pointer transition-all ${
                  n.isRead ? 'bg-white border-gray-100 opacity-75' : `${cfg.bg} ${cfg.border}`
                }`}
              >
                {!n.isRead && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500" />}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.isRead ? 'bg-gray-100 text-gray-400' : cfg.badge}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${n.isRead ? 'text-gray-600' : cfg.text}`}>{n.title}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${n.isRead ? 'bg-gray-100 text-gray-400' : cfg.badge}`}>{n.type}</span>
                    {n.targetRole !== 'all' && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded capitalize">→ {n.targetRole}s</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    By {n.createdByName || 'System'} · {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {(isAdmin || role === 'admin') && (
                  <button
                    onClick={e => { e.stopPropagation(); deleteNotif(n._id); }}
                    className="absolute bottom-3 right-3 p-1 text-gray-300 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}