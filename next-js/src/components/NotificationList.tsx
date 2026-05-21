import React, { useState, useEffect, useMemo } from 'react';
import { Bell, CheckCircle, MessageSquare, AlertTriangle, User } from 'lucide-react';
import notificationService from '../services/notificationService';
import DashboardPageLayout from './dashboard/DashboardPageLayout';
import DashboardSplashTitle from './dashboard/DashboardSplashTitle';

// Simple date formatting function
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const linkifyText = (text) => {
    if (!text) return text;
    const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/g;
    const parts = String(text).split(urlRegex);
    return parts.map((part, idx) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={`url-${idx}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline break-all transition-colors"
          >
            {part}
          </a>
        );
      }
      return <span key={`text-${idx}`}>{part}</span>;
    });
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (isMarkingRead) return;
    
    setIsMarkingRead(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError('Failed to mark notifications as read.');
    } finally {
      setIsMarkingRead(false);
    }
  };

  const getNotificationIcon = (messageType) => {
    switch (messageType) {
      case 'ASSIGNED_TO_SOLVER':
        return <User className="h-5 w-5 text-[var(--dash-forest)]" />;
      case 'SOLUTION_SUBMITTED':
        return <MessageSquare className="h-5 w-5 text-[var(--dash-forest)]" />;
      case 'SOLUTION_ACCEPTED':
        return <CheckCircle className="h-5 w-5 text-[var(--dash-forest)]" />;
      case 'DOUBT_SUBMITTED':
        return <Bell className="h-5 w-5 text-[var(--dash-forest)]" />;
      case 'DOUBT_ASSIGNED':
        return <User className="h-5 w-5 text-[var(--dash-forest)]" />;
      case 'DOUBT_AVAILABLE':
        return <Bell className="h-5 w-5 text-[var(--dash-forest)]" />;
      default:
        return <Bell className="h-5 w-5 text-[var(--dash-forest)]" />;
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return d
      .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      .toLowerCase();
  };

  const getDayKey = (dateValue) => {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return 'older';
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);
    const itemStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (itemStart.getTime() === todayStart.getTime()) return 'today';
    if (itemStart.getTime() === yesterdayStart.getTime()) return 'yesterday';
    return itemStart.toISOString().slice(0, 10);
  };

  const groupedNotifications = useMemo(() => {
    const map = new Map();
    notifications.forEach((notification) => {
      const key = getDayKey(notification.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(notification);
    });

    const sections = [];
    if (map.has('today')) sections.push({ label: 'Today', items: map.get('today') });
    if (map.has('yesterday')) sections.push({ label: 'Yesterday', items: map.get('yesterday') });

    const olderKeys = [...map.keys()]
      .filter((k) => k !== 'today' && k !== 'yesterday')
      .sort((a, b) => (a < b ? 1 : -1));

    olderKeys.forEach((key) => {
      const label = new Date(key).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      sections.push({ label, items: map.get(key) });
    });

    return sections;
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (isLoading) {
    return (
      <DashboardPageLayout loadingMessage="Loading notifications…">
        <div className="flex min-h-[16rem] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--dash-forest)]" />
          <span className="ml-3 text-[var(--dash-text-body)]">Loading notifications...</span>
        </div>
      </DashboardPageLayout>
    );
  }

  if (error) {
    return (
      <DashboardPageLayout loadingMessage="Loading notifications…" contentVariant="card">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-red-500" />
          <p className="text-red-600">{error}</p>
          <button onClick={fetchNotifications} className="mt-3 text-sm text-red-700 underline">
            Try again
          </button>
        </div>
      </DashboardPageLayout>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const notificationsHeader = (
    <header className="dash-page-header mb-4 flex flex-wrap items-center justify-between gap-3 md:mb-5">
      <DashboardSplashTitle variant="page">Notifications</DashboardSplashTitle>
      <div className="flex items-center gap-2">
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={isMarkingRead}
            className="inline-flex shrink-0 items-center rounded-full border border-[var(--dash-panel-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dash-forest)] shadow-[var(--dash-inner-shadow)] transition-colors hover:bg-[var(--dash-card-mint)] disabled:opacity-50"
          >
            {isMarkingRead ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#073E36] px-4 py-2 text-sm font-semibold text-white shadow-[var(--dash-inner-shadow)]">
          {unreadCount} unread
        </span>
      </div>
    </header>
  );

  return (
    <DashboardPageLayout loadingMessage="Loading notifications…" contentVariant="card" topBar={notificationsHeader}>
      {notifications.length === 0 ? (
        <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[20px] bg-white/60 px-6 py-14 text-center">
          <Bell className="mb-4 h-12 w-12 text-[var(--dash-text-muted)]" />
          <p className="text-sm font-medium text-[var(--dash-text-body)]">No notifications yet.</p>
          <p className="mt-1 text-xs text-[var(--dash-text-muted)]">
            Updates about your doubts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedNotifications.map((section) => (
            <section key={section.label} className="space-y-3">
              <h2 className="text-[1.9rem] font-extrabold leading-none tracking-tight text-[var(--dash-forest)]">
                {section.label}
              </h2>
              <div className="rounded-[18px] border border-[var(--dash-panel-border)] bg-white p-4 shadow-[var(--dash-inner-shadow)]">
                <div className="space-y-3">
                  {section.items.map((notification) => (
                    <article
                      key={notification._id}
                      className="notification-tile rounded-[14px] border border-[#edf2e9] bg-white px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-16 w-[5px] shrink-0 rounded-full bg-[#073E36]" />
                        <div className="mt-1 shrink-0">{getNotificationIcon(notification.message_type)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <p
                              className={`min-w-0 flex-1 truncate text-base font-semibold ${
                                notification.is_read ? 'text-[#243833]' : 'text-black'
                              }`}
                            >
                              {notification.title || 'Notification'}
                            </p>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="whitespace-nowrap text-xs text-[var(--dash-text-muted)]">
                                {formatTime(notification.createdAt)}
                              </span>
                              {!notification.is_read ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#073E36]" />
                              ) : null}
                            </div>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-[var(--dash-text-body)]">
                            {linkifyText(notification.content)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </DashboardPageLayout>
  );
};

export default NotificationList;
