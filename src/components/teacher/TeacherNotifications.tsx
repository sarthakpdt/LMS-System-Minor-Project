import { useState } from 'react';
import { Bell, Calendar, FileText, AlertCircle, CheckCircle, Clock, Users, BookOpen, Filter, Trash2, Eye } from 'lucide-react';

interface Notification {
  id: number;
  type: 'class' | 'assignment' | 'quiz' | 'system' | 'deadline';
  title: string;
  message: string;
  time: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  subject?: string;
  actionRequired?: boolean;
}

const notificationsData: Notification[] = [
  {
    id: 1,
    type: 'assignment',
    title: 'New Assignment Submissions',
    message: '23 students have submitted "Calculus Problem Set 5" for Mathematics 101',
    time: '10 minutes ago',
    date: '2026-01-29',
    priority: 'high',
    read: false,
    subject: 'Mathematics 101',
    actionRequired: true
  },
  {
    id: 2,
    type: 'deadline',
    title: 'Assignment Deadline Approaching',
    message: 'Physics Lab Report 3 is due in 2 hours. 45 students have not submitted yet.',
    time: '30 minutes ago',
    date: '2026-01-29',
    priority: 'high',
    read: false,
    subject: 'Physics 202',
    actionRequired: true
  },
  {
    id: 3,
    type: 'class',
    title: 'Class Schedule Change',
    message: 'Mathematics 101 - Class moved from Room 204 to Auditorium B for tomorrow\'s session',
    time: '1 hour ago',
    date: '2026-01-29',
    priority: 'high',
    read: false,
    subject: 'Mathematics 101',
    actionRequired: false
  },
  {
    id: 4,
    type: 'quiz',
    title: 'Quiz Results Available',
    message: 'All students have completed Quiz 5 for Mathematics 101. Results ready for review.',
    time: '2 hours ago',
    date: '2026-01-29',
    priority: 'medium',
    read: false,
    subject: 'Mathematics 101',
    actionRequired: true
  },
  {
    id: 5,
    type: 'assignment',
    title: 'Late Submission Alert',
    message: '8 students submitted assignments after the deadline for Physics 202',
    time: '3 hours ago',
    date: '2026-01-29',
    priority: 'medium',
    read: true,
    subject: 'Physics 202',
    actionRequired: true
  },
  {
    id: 6,
    type: 'class',
    title: 'Low Attendance Alert',
    message: 'Only 68% attendance recorded for today\'s Mathematics 101 class',
    time: '4 hours ago',
    date: '2026-01-29',
    priority: 'medium',
    read: true,
    subject: 'Mathematics 101',
    actionRequired: false
  },
  {
    id: 7,
    type: 'system',
    title: 'Student Promotion',
    message: '5 students have been automatically promoted to Advanced level based on consistent performance',
    time: '5 hours ago',
    date: '2026-01-29',
    priority: 'low',
    read: true,
    subject: 'System',
    actionRequired: false
  },
  {
    id: 8,
    type: 'assignment',
    title: 'Assignment Grading Complete',
    message: 'All submissions for "Linear Algebra Assignment 2" have been auto-graded',
    time: '6 hours ago',
    date: '2026-01-28',
    priority: 'low',
    read: true,
    subject: 'Mathematics 101',
    actionRequired: false
  },
  {
    id: 9,
    type: 'class',
    title: 'Upcoming Class Reminder',
    message: 'Physics 202 - Laboratory session scheduled for tomorrow at 2:00 PM',
    time: '8 hours ago',
    date: '2026-01-28',
    priority: 'low',
    read: true,
    subject: 'Physics 202',
    actionRequired: false
  },
  {
    id: 10,
    type: 'deadline',
    title: 'Assignment Deadline Extended',
    message: 'Physics Lab Report 2 deadline has been extended by 48 hours due to equipment issues',
    time: '1 day ago',
    date: '2026-01-28',
    priority: 'medium',
    read: true,
    subject: 'Physics 202',
    actionRequired: false
  },
  {
    id: 11,
    type: 'quiz',
    title: 'New Quiz Scheduled',
    message: 'Quiz 6 for Mathematics 101 has been scheduled for February 2, 2026',
    time: '1 day ago',
    date: '2026-01-28',
    priority: 'low',
    read: true,
    subject: 'Mathematics 101',
    actionRequired: false
  },
  {
    id: 12,
    type: 'class',
    title: 'Guest Lecture Confirmed',
    message: 'Dr. Anderson will conduct a guest lecture on Advanced Calculus next week',
    time: '2 days ago',
    date: '2026-01-27',
    priority: 'low',
    read: true,
    subject: 'Mathematics 101',
    actionRequired: false
  },
];

export function TeacherNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(notificationsData);
  const [filterType, setFilterType] = useState<'all' | 'class' | 'assignment' | 'quiz' | 'system' | 'deadline'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesRead = filterRead === 'all' || (filterRead === 'unread' ? !notification.read : notification.read);
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
    return matchesType && matchesRead && matchesPriority;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'class': return Calendar;
      case 'assignment': return FileText;
      case 'quiz': return BookOpen;
      case 'system': return AlertCircle;
      case 'deadline': return Clock;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'class': return 'bg-blue-100 text-blue-600';
      case 'assignment': return 'bg-purple-100 text-purple-600';
      case 'quiz': return 'bg-green-100 text-green-600';
      case 'system': return 'bg-gray-100 text-gray-600';
      case 'deadline': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-red-500';
      case 'medium': return 'border-l-4 border-l-yellow-500';
      case 'low': return 'border-l-4 border-l-gray-300';
      default: return '';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Notifications</h2>
        <p className="text-gray-600">Stay updated with important class and assignment notifications.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Bell className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Total Notifications</p>
          <p className="text-4xl font-bold">{notifications.length}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            {unreadCount > 0 && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                New
              </span>
            )}
          </div>
          <p className="text-sm opacity-90 mb-1">Unread</p>
          <p className="text-4xl font-bold">{unreadCount}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <CheckCircle className="w-6 h-6" />
            </div>
            {actionRequiredCount > 0 && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                Action
              </span>
            )}
          </div>
          <p className="text-sm opacity-90 mb-1">Require Action</p>
          <p className="text-4xl font-bold">{actionRequiredCount}</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Types</option>
              <option value="class">Class</option>
              <option value="assignment">Assignment</option>
              <option value="quiz">Quiz</option>
              <option value="deadline">Deadline</option>
              <option value="system">System</option>
            </select>

            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              unreadCount === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Mark All as Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => {
          const Icon = getTypeIcon(notification.type);
          return (
            <div
              key={notification.id}
              className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
                !notification.read ? 'bg-blue-50/30' : ''
              } ${getPriorityColor(notification.priority)}`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold text-gray-900 ${!notification.read ? 'font-bold' : ''}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                            New
                          </span>
                        )}
                        {notification.actionRequired && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                            Action Required
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          notification.priority === 'high' ? 'bg-red-100 text-red-700' :
                          notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)} Priority
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-3">{notification.message}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{notification.time}</span>
                      </div>
                      {notification.subject && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{notification.subject}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications found</h3>
          <p className="text-gray-600">There are no notifications matching your current filters.</p>
        </div>
      )}
    </div>
  );
}
