import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBell, FaExclamationTriangle, FaShieldAlt,
  FaKey, FaSync, FaTrash, FaEye,
  FaFilter, FaSort, FaClock, FaBellSlash, FaRegBell,
  FaChevronRight, FaCreditCard
} from 'react-icons/fa';
import { HiBell, HiBellAlert } from 'react-icons/hi2';
import { IoCheckmarkDoneCircle } from "react-icons/io5";
import axios from 'axios';
import alertService, { Alert } from '../../services/alertService';
import { notificationAPI } from '../../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'alert' | 'security' | 'sync' | 'info';
  category: 'password' | 'security' | 'sync' | 'system' | 'billing' | 'profile' | 'document' | 'alerts';
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  action?: {
    type: 'internal' | 'external';
    label: string;
    link?: string;
  };
  metadata?: {
    resourceType?: string;
    resourceId?: string;
    oldValue?: string;
    newValue?: string;
    category?: string;
    expiryFormatted?: string;
    expiryDateString?: string;
    daysUntilExpiry?: number;
  };
  isAlertType?: boolean;
}

const API_URL = 'http://localhost:5000/api';

// ─── Component ───────────────────────────────────────────────────────────────

const Notifications = () => {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priority'>('newest');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [filter, sortBy]);

  // ─── Data helpers ──────────────────────────────────────────────────────────

  const convertAlertToNotification = (alert: Alert): Notification => {
    const priorityMap: Record<string, 'high' | 'medium' | 'low'> = {
      critical: 'high',
      high: 'high',
      medium: 'medium',
      low: 'low',
    };

    let notificationType: Notification['type'] = 'alert';
    if (alert.severity === 'critical' || alert.severity === 'high') notificationType = 'alert';
    else if (alert.severity === 'medium') notificationType = 'warning';
    else notificationType = 'info';

    let category: Notification['category'] = 'alerts';
    if (alert.alertType.includes('password')) category = 'password';
    else if (alert.alertType.includes('security') || alert.alertType.includes('breach') || alert.alertType.includes('login')) category = 'security';
    else if (alert.alertType.includes('sync')) category = 'sync';
    else if (alert.alertType.includes('document') || alert.alertType.includes('card') || alert.alertType.includes('pass')) category = 'alerts';

    return {
      _id: alert._id,
      title: alert.title,
      message: alert.message,
      type: notificationType,
      category,
      priority: priorityMap[alert.severity] || 'medium',
      isRead: alert.isRead,
      createdAt: new Date(alert.createdAt).toISOString(),
      readAt: alert.readAt ? new Date(alert.readAt).toISOString() : undefined,
      action: alert.actionRequired && alert.actionUrl
        ? { type: 'internal' as const, label: alert.actionLabel || 'View Details', link: alert.actionUrl }
        : undefined,
      metadata: alert.metadata,
      isAlertType: true,
    };
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      if (!isAuthenticated) {
        setError('Authentication required');
        setNotifications([]);
        return;
      }

      const [notificationsResponse, alertsResponse] = await Promise.all([
        notificationAPI.getNotifications({
          filter: filter === 'all' ? undefined : filter,
          sortBy: sortBy === 'priority' ? 'priority' : 'date',
          limit: 100,
        }).catch(err => {
          console.error('Error fetching notifications:', err);
          return { data: { success: false, data: { notifications: [] } } };
        }),
        alertService.getAlerts({ isResolved: false, limit: 100 }).catch(err => {
          console.error('Error fetching alerts:', err);
          return { alerts: [], pagination: { current: 1, pages: 0, total: 0 } };
        }),
      ]);

      let allNotifications: Notification[] = [];

      if (notificationsResponse.data.success) {
        allNotifications = [...notificationsResponse.data.data.notifications];
      }

      if (alertsResponse?.alerts && Array.isArray(alertsResponse.alerts) && alertsResponse.alerts.length > 0) {
        const convertedAlerts = alertsResponse.alerts.map(alert => convertAlertToNotification(alert));
        allNotifications = [...allNotifications, ...convertedAlerts];
      }

      if (filter !== 'all') {
        allNotifications = allNotifications.filter(n => n.category === filter);
      }

      if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        allNotifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      } else {
        allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      setNotifications(allNotifications);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  const markAsRead = async (id: string) => {
    try {
      const notification = notifications.find(n => n._id === id);
      if (notification?.isAlertType) {
        await alertService.markAsRead(id);
      } else {
        await notificationAPI.markAsRead(id);
      }
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const notification = notifications.find(n => n._id === id);
      if (notification?.isAlertType) {
        await alertService.deleteAlert(id);
      } else {
        await notificationAPI.deleteNotification(id);
      }
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleAction = (notification: Notification) => {
    if (notification.action?.link) {
      if (notification.action.type === 'internal') window.location.href = notification.action.link;
      else window.open(notification.action.link, '_blank');
    }
    markAsRead(notification._id);
  };

  const markAllAsRead = async () => {
    try {
      const regularNotifications = notifications.filter(n => !n.isAlertType && !n.isRead);
      const alertNotifications = notifications.filter(n => n.isAlertType && !n.isRead);

      if (regularNotifications.length > 0) {
        await notificationAPI.markAllAsRead().catch(err => { throw err; });
      }
      if (alertNotifications.length > 0) {
        await axios.put(
          `${API_URL}/alerts/mark-all-read`,
          {},
          { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
        ).catch(err => { throw err; });
      }

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      alert(err.response?.data?.message || 'Failed to mark all as read. Please try again.');
    }
  };

  const clearAllNotifications = async () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      try {
        const token = localStorage.getItem('accessToken');
        const regularNotifications = notifications.filter(n => !n.isAlertType);
        const alertNotifications = notifications.filter(n => n.isAlertType);

        if (regularNotifications.length > 0) {
          await axios.delete(`${API_URL}/user/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(err => console.error('Error clearing regular notifications:', err));
        }
        if (alertNotifications.length > 0) {
          await Promise.all(
            alertNotifications.map(alert =>
              alertService.deleteAlert(alert._id).catch(err =>
                console.error(`Error deleting alert ${alert._id}:`, err)
              )
            )
          );
        }
        setNotifications([]);
      } catch (err) {
        console.error('Error clearing notifications:', err);
      }
    }
  };

  // ─── Display helpers ───────────────────────────────────────────────────────

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'JUST NOW';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}M AGO`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}H AGO`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}D AGO`;
    return date.toLocaleDateString().toUpperCase();
  };

  // Square icon boxes — zero radius, newsprint aesthetic
  const getIcon = (type: string) => {
    const base = 'w-10 h-10 border-2 flex items-center justify-center flex-shrink-0';
    switch (type) {
      case 'success':
        return (
          <div className={`${base} border-[#111111] bg-[#111111]`}>
            <IoCheckmarkDoneCircle className="text-[#F9F9F7] w-5 h-5" />
          </div>
        );
      case 'warning':
        return (
          <div className={`${base} border-[#111111] bg-[#E5E5E0]`}>
            <FaExclamationTriangle className="text-[#111111] w-4 h-4" />
          </div>
        );
      case 'alert':
        return (
          <div className={`${base} border-[#CC0000] bg-[#CC0000]`}>
            <HiBellAlert className="text-[#F9F9F7] w-5 h-5" />
          </div>
        );
      case 'security':
        return (
          <div className={`${base} border-[#111111] bg-[#111111]`}>
            <FaShieldAlt className="text-[#F9F9F7] w-4 h-4" />
          </div>
        );
      case 'sync':
        return (
          <div className={`${base} border-[#111111] bg-[#F9F9F7]`}>
            <FaSync className="text-[#111111] w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className={`${base} border-[#111111] bg-[#F9F9F7]`}>
            <HiBell className="text-[#111111] w-5 h-5" />
          </div>
        );
    }
  };

  const getPriorityStyles = (priority: string) => {
    if (priority === 'high') return 'border-[#CC0000] text-[#CC0000] bg-[#FFF5F5]';
    if (priority === 'medium') return 'border-[#111111] text-[#111111] bg-[#E5E5E0]';
    return 'border-[#A3A3A3] text-[#737373] bg-[#F9F9F7]';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifications = notifications;

  const categories = [
    { id: 'all', label: 'ALL', icon: FaBell },
    { id: 'alerts', label: 'ALERTS', icon: HiBellAlert },
    { id: 'security', label: 'SECURITY', icon: FaShieldAlt },
    { id: 'password', label: 'PASSWORDS', icon: FaKey },
    { id: 'sync', label: 'SYNC', icon: FaSync },
    { id: 'billing', label: 'BILLING', icon: FaCreditCard },
    { id: 'document', label: 'DOCUMENTS', icon: FaKey },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="bg-[#F9F9F7]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
      }}
    >

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="border-4 border-[#111111] bg-[#111111]">
        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-6">

            {/* Left: title block */}
            <div>
              {/* Edition badge */}
              <div className="inline-flex items-center gap-2 mb-4 border border-[#CC0000] px-3 py-1">
                {unreadCount > 0 ? (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="w-2 h-2 bg-[#CC0000] inline-block"
                  />
                ) : (
                  <span className="w-2 h-2 bg-[#F9F9F7] inline-block" />
                )}
                <span
                  className="text-[0.65rem] font-black uppercase tracking-widest text-[#F9F9F7]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {unreadCount > 0 ? `${unreadCount} UNREAD` : 'ALL CLEAR'}
                </span>
              </div>

              <h1
                className="text-4xl md:text-5xl font-black text-[#F9F9F7] tracking-tighter leading-none"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Notifications
              </h1>
              <p
                className="text-[#A3A3A3] mt-2 text-sm leading-relaxed max-w-md"
                style={{ fontFamily: "'Lora', serif" }}
              >
                Security updates, account alerts and sync events — all in one place.
              </p>
            </div>

            {/* Right: action buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2.5 bg-[#F9F9F7] text-[#111111] font-black uppercase tracking-widest
                             text-xs border-2 border-[#F9F9F7] hover:bg-[#111111] hover:text-[#F9F9F7]
                             hover:border-[#CC0000] transition-all duration-200 flex items-center gap-2 w-full sm:w-auto"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <IoCheckmarkDoneCircle />
                  MARK ALL READ
                </button>
              )}

              <button
                onClick={clearAllNotifications}
                className="px-4 py-2.5 bg-[#CC0000] text-[#F9F9F7] font-black uppercase tracking-widest
                           text-xs border-2 border-[#CC0000] hover:bg-[#990000] hover:border-[#990000]
                           transition-all duration-200 flex items-center gap-2 w-full sm:w-auto"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <FaTrash />
                CLEAR ALL
              </button>
            </div>
          </div>

          {/* Read-progress bar */}
          {notifications.length > 0 && (
            <div className="mt-7">
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[0.6rem] uppercase tracking-widest text-[#737373]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  READ PROGRESS
                </span>
                <span
                  className="text-[0.6rem] text-[#737373]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {notifications.length - unreadCount} / {notifications.length}
                </span>
              </div>
              <div className="w-full h-1 bg-[#333333]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((notifications.length - unreadCount) / Math.max(notifications.length, 1)) * 100}%`,
                  }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="h-full bg-[#CC0000]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FILTER CONTROLS ────────────────────────────────────────────────── */}
      <div className="border-2 border-t-0 border-[#111111] bg-[#F9F9F7]">

        {/* Control row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-5 py-3.5 border-b-2 border-[#111111]">
          <div className="flex items-center gap-2">
            <FaFilter className="text-[#111111] text-xs" />
            <span
              className="text-xs font-black uppercase tracking-widest text-[#111111]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              FILTER NOTIFICATIONS
            </span>
          </div>

          <div className="flex items-center gap-2 border-2 border-[#111111] px-3 py-2 bg-[#F9F9F7] hover:bg-[#E5E5E0] transition-colors">
            <FaSort className="text-[#111111] text-xs" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'newest' | 'priority')}
              className="bg-transparent border-none text-[0.7rem] font-black uppercase tracking-widest
                         focus:ring-0 focus:outline-none text-[#111111] cursor-pointer"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <option value="newest">SORT BY DATE</option>
              <option value="priority">SORT BY PRIORITY</option>
            </select>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto divide-x-2 divide-[#111111]">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setFilter(category.id)}
              className={`px-4 py-3 flex items-center gap-1.5 whitespace-nowrap text-[0.65rem] font-black
                          uppercase tracking-widest transition-colors duration-200 flex-shrink-0
                          ${filter === category.id
                  ? 'bg-[#111111] text-[#F9F9F7]'
                  : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0]'
                }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <category.icon className="text-[0.6rem]" />
              {category.label}
              {category.id === 'all' && unreadCount > 0 && (
                <span className="bg-[#CC0000] text-[#F9F9F7] text-[0.55rem] px-1.5 py-0.5 font-black leading-tight">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}

      {/* Loading */}
      {loading && (
        <div className="border-2 border-t-0 border-[#111111] bg-[#F9F9F7] p-16 flex flex-col items-center gap-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-4 border-[#111111] border-t-[#CC0000]"
          />
          <p
            className="text-xs font-black uppercase tracking-widest text-[#525252]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            LOADING NOTIFICATIONS...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="border-2 border-t-0 border-[#111111] bg-[#F9F9F7] p-16 text-center">
          <div className="border-4 border-dashed border-[#CC0000] p-10 max-w-sm mx-auto">
            <FaExclamationTriangle className="text-[#CC0000] text-4xl mx-auto mb-5" />
            <h3
              className="text-2xl font-black uppercase tracking-tighter text-[#111111] mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              LOAD FAILED
            </h3>
            <p className="text-[#525252] mb-6 text-sm" style={{ fontFamily: "'Lora', serif" }}>
              {error}
            </p>
            <button
              onClick={fetchNotifications}
              className="px-6 py-3 bg-[#111111] text-[#F9F9F7] font-black uppercase text-xs
                         tracking-widest hover:bg-[#CC0000] transition-colors duration-200"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredNotifications.length === 0 && (
        <div className="border-2 border-t-0 border-[#111111] bg-[#F9F9F7] p-16 text-center">
          <div className="border-4 border-dashed border-[#111111] p-12 max-w-sm mx-auto">
            <FaBellSlash className="text-[#111111] text-5xl mx-auto mb-6" />
            <h3
              className="text-2xl font-black uppercase tracking-tighter text-[#111111] mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              INBOX CLEAR
            </h3>
            <p className="text-[#525252] text-sm" style={{ fontFamily: "'Lora', serif" }}>
              {filter !== 'all'
                ? `No ${filter.toLowerCase()} notifications to display.`
                : "You're fully up to date. No new notifications."}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-6 px-6 py-3 border-2 border-[#111111] text-[#111111] font-black uppercase
                           text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors duration-200"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                VIEW ALL
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notification list */}
      {!loading && !error && filteredNotifications.length > 0 && (
        <AnimatePresence mode="popLayout">
          <div className="border-2 border-t-0 border-[#111111] divide-y-2 divide-[#111111]">

            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification._id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.18, delay: index * 0.025 }}
                className={`relative bg-[#F9F9F7] transition-colors duration-150
                  group hover:bg-[#ECECEA]
                  ${!notification.isRead ? 'border-l-[3px] border-l-[#CC0000]' : ''}`}
              >
                <div className="p-5 md:p-6 flex gap-4 md:gap-5">

                  {/* Icon */}
                  {getIcon(notification.type)}

                  {/* Content */}
                  <div className="flex-1 min-w-0">

                    {/* Title + priority */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`font-black text-[0.95rem] tracking-tight leading-snug
                              ${!notification.isRead ? 'text-[#111111]' : 'text-[#525252]'}`}
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <motion.span
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 1.6, repeat: Infinity }}
                              className="w-2 h-2 bg-[#CC0000] inline-block flex-shrink-0"
                            />
                          )}
                        </div>

                        <p
                          className="text-[#525252] mt-1.5 text-sm leading-relaxed"
                          style={{ fontFamily: "'Lora', serif" }}
                        >
                          {notification.message}
                        </p>
                      </div>

                      {/* Priority badge */}
                      <span
                        className={`text-[0.6rem] px-2 py-1 border font-black uppercase tracking-widest
                                    flex-shrink-0 ${getPriorityStyles(notification.priority)}`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {notification.priority.toUpperCase()}
                      </span>
                    </div>

                    {/* Metadata row */}
                    {notification.metadata?.expiryFormatted && (
                      <div
                        className="mt-2 text-[0.65rem] text-[#CC0000] font-black uppercase tracking-widest"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        EXPIRES: {notification.metadata.expiryFormatted}
                        {notification.metadata.daysUntilExpiry !== undefined &&
                          ` — ${notification.metadata.daysUntilExpiry}D REMAINING`}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E5E5E0] flex-wrap gap-3">

                      {/* Meta info */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div
                          className="flex items-center gap-1.5 text-[0.65rem] text-[#737373] uppercase tracking-widest"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          <FaClock className="text-[0.5rem]" />
                          {getRelativeTime(notification.createdAt)}
                        </div>

                        <span
                          className="text-[0.65rem] text-[#737373] uppercase tracking-widest"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {notification.category}
                        </span>

                        {notification.isRead ? (
                          <span
                            className="flex items-center gap-1 text-[0.65rem] text-[#111111] uppercase tracking-widest"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            <IoCheckmarkDoneCircle /> READ
                          </span>
                        ) : (
                          <span
                            className="flex items-center gap-1 text-[0.65rem] text-[#CC0000] uppercase tracking-widest"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            <FaRegBell /> UNREAD
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {notification.action && (
                          <button
                            onClick={() => handleAction(notification)}
                            className="px-3.5 py-2 bg-[#111111] text-[#F9F9F7] font-black uppercase text-[0.6rem]
                                       tracking-widest hover:bg-[#CC0000] transition-colors duration-200
                                       flex items-center gap-1.5"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {notification.action.label}
                            <FaChevronRight className="text-[0.5rem]" />
                          </button>
                        )}

                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            title="Mark as read"
                            className="p-2.5 border-2 border-[#111111] text-[#111111] hover:bg-[#111111]
                                       hover:text-[#F9F9F7] transition-colors duration-200"
                          >
                            <FaEye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => deleteNotification(notification._id)}
                          title="Delete"
                          className="p-2.5 border-2 border-[#111111] text-[#111111] hover:bg-[#CC0000]
                                     hover:text-[#F9F9F7] hover:border-[#CC0000] transition-colors duration-200"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* View all strip */}
            {filteredNotifications.length > 0 && filteredNotifications.length < notifications.length && (
              <div className="p-4 bg-[#E5E5E0] border-t-2 border-[#111111] flex justify-center">
                <button
                  onClick={() => setFilter('all')}
                  className="px-6 py-3 border-2 border-[#111111] text-[#111111] font-black uppercase
                             text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7]
                             transition-colors duration-200 flex items-center gap-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <FaBell /> VIEW ALL NOTIFICATIONS
                </button>
              </div>
            )}

          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default Notifications;