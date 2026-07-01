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

  // Square icon boxes — zero radius, newsprint aesthetic — matching BackUp's p-4 icon box pattern
  const getIcon = (type: string) => {
    const base = 'p-4 border-2 flex items-center justify-center flex-shrink-0';
    switch (type) {
      case 'success':
        return (
          <div className={`${base} border-[#111111] bg-[#111111]`}>
            <IoCheckmarkDoneCircle className="text-[#F9F9F7] h-6 w-6" />
          </div>
        );
      case 'warning':
        return (
          <div className={`${base} border-[#111111] bg-[#E5E5E0]`}>
            <FaExclamationTriangle className="text-[#111111] h-5 w-5" />
          </div>
        );
      case 'alert':
        return (
          <div className={`${base} border-[#CC0000] bg-[#CC0000]`}>
            <HiBellAlert className="text-[#F9F9F7] h-6 w-6" />
          </div>
        );
      case 'security':
        return (
          <div className={`${base} border-[#111111] bg-[#111111]`}>
            <FaShieldAlt className="text-[#F9F9F7] h-5 w-5" />
          </div>
        );
      case 'sync':
        return (
          <div className={`${base} border-[#111111] bg-[#F9F9F7]`}>
            <FaSync className="text-[#111111] h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className={`${base} border-[#111111] bg-[#F9F9F7]`}>
            <HiBell className="text-[#111111] h-6 w-6" />
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
    <>
      {/* ── FONT IMPORTS & UTILITY CLASSES ─────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');
        .sharp-corners { border-radius: 0px !important; }
        .newsprint-texture { position: relative; }
        .newsprint-texture::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(0deg, transparent 98%, rgba(0,0,0,0.02) 100%),
            linear-gradient(90deg, transparent 98%, rgba(0,0,0,0.02) 100%);
          background-size: 3px 3px;
          pointer-events: none;
          opacity: 0.5;
          z-index: 0;
        }
        .hard-shadow-hover { transition: all 0.2s ease-out; }
        .hard-shadow-hover:hover {
          box-shadow: 4px 4px 0px 0px #111111;
          transform: translate(-2px, -2px);
        }
      `}</style>

      <div
        className="bg-[#F9F9F7] min-h-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`,
        }}
      >

        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <div className="border-b-4 border-[#111111] bg-[#F9F9F7] p-8 md:p-12 relative overflow-hidden newsprint-texture">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">

            {/* Left: title block */}
            <div>
              {/* Edition badge */}
              <div className="inline-flex items-center gap-2 border border-[#111111] px-3 py-1 mb-6">
                {unreadCount > 0 ? (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="w-2 h-2 bg-[#CC0000] inline-block"
                  />
                ) : (
                  <span className="w-2 h-2 bg-[#111111] inline-block" />
                )}
                <span
                  className="text-[0.65rem] font-black uppercase tracking-widest text-[#111111]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  SYSTEM INBOX &bull; ALERTS
                </span>
              </div>

              <h1
                className="text-5xl md:text-7xl font-black leading-[0.85] tracking-tighter text-[#111111]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                INBOX &<br />
                <span className="italic" style={{ color: "#CC0000" }}>ALERTS</span>
              </h1>
              <p
                className="mt-6 text-lg text-[#525252] max-w-2xl leading-relaxed border-l-4 border-[#CC0000] pl-4"
                style={{ fontFamily: "'Lora', serif" }}
              >
                Security updates, account alerts and sync events — all in one place.
              </p>
            </div>

            {/* Right: action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto mt-8 md:mt-0">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-6 py-4 border-2 border-[#111111] font-black uppercase text-xs tracking-widest transition-all bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0] hard-shadow-hover flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <IoCheckmarkDoneCircle />
                  MARK ALL READ
                </button>
              )}
              <button
                onClick={clearAllNotifications}
                disabled={notifications.length === 0}
                className="px-8 py-4 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <FaTrash />
                CLEAR ALL
              </button>
            </div>
          </div>

          {/* ── STATS TICKER ─────────────────────────────────────────────────── */}
          <div className="mt-12 pt-6 border-t-4 border-[#111111] grid grid-cols-2 md:grid-cols-5 gap-0 bg-[#111111] relative z-10">

            <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
              <div
                className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                [TOTAL]
              </div>
              <div
                className="font-black text-[#111111] flex items-center gap-2 text-2xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                <FaBell className="text-lg" /> {notifications.length}
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
              <div
                className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                [UNREAD]
              </div>
              <div
                className={`font-black text-2xl ${unreadCount > 0 ? 'text-[#CC0000]' : 'text-[#111111]'}`}
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {unreadCount}
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
              <div
                className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                [CRITICAL]
              </div>
              <div
                className="font-bold text-[#111111] text-xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {notifications.filter(n => n.priority === 'high').length}
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-[#F9F9F7] border-r border-b md:border-b-0 border-[#111111] p-4 hover:bg-[#E5E5E0] transition-colors">
              <div
                className="text-[0.6rem] text-[#CC0000] font-bold uppercase tracking-widest mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                [FILTER]
              </div>
              <div
                className="font-bold text-[#111111] text-sm"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {filter.toUpperCase()}
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-[#111111]">
              <button
                onClick={fetchNotifications}
                className="w-full h-full flex items-center justify-center gap-2 bg-[#111111] text-[#F9F9F7] font-black text-xs uppercase tracking-widest p-4 hover:bg-[#CC0000] transition-colors"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <FaSync /> REFRESH
              </button>
            </div>
          </div>

          {/* Read-progress bar inside stats ticker last cell (desktop-only inline) */}
          {notifications.length > 0 && (
            <div className="mt-0 bg-[#111111] px-4 pb-4 relative z-10 block md:hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[0.6rem] uppercase tracking-widest text-[#A3A3A3]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  READ PROGRESS
                </span>
                <span
                  className="text-[0.6rem] text-[#A3A3A3]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {notifications.length - unreadCount} / {notifications.length}
                </span>
              </div>
              <div className="w-full h-2 border border-[#333333] bg-[#222222]">
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

        {/* ── FILTER & SORT CONTROLS ──────────────────────────────────────────── */}
        <div className="border-b-4 border-[#111111] bg-[#F9F9F7]">

          {/* Dark section header */}
          <div className="bg-[#111111] text-[#F9F9F7] p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="p-3 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111]">
                  <FaFilter className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    className="text-2xl font-black tracking-tighter uppercase"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    FILTER & SORT
                  </h3>
                  <p
                    className="text-[#A3A3A3] mt-1 text-sm"
                    style={{ fontFamily: "'Lora', serif" }}
                  >
                    Narrow down your notifications by category or urgency
                  </p>
                </div>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 border-2 border-[#404040] px-4 py-3 bg-[#111111] hover:bg-[#1a1a1a] transition-colors">
                <FaSort className="text-[#F9F9F7] text-xs" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'newest' | 'priority')}
                  className="bg-transparent border-none text-[0.7rem] font-black uppercase tracking-widest focus:ring-0 focus:outline-none text-[#F9F9F7] cursor-pointer"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <option value="newest" className="bg-[#111111] text-[#F9F9F7]">SORT BY DATE</option>
                  <option value="priority" className="bg-[#111111] text-[#F9F9F7]">SORT BY PRIORITY</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex overflow-x-auto divide-x-2 divide-[#111111] border-t-2 border-[#111111]">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setFilter(category.id)}
                className={`px-4 py-3.5 flex items-center gap-1.5 whitespace-nowrap text-[0.65rem] font-black
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

        {/* ── LOADING ─────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#111111] text-[#F9F9F7] border-b-4 border-[#CC0000] p-8 md:p-12"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b-2 border-[#404040] pb-6">
                <div className="flex items-center gap-5">
                  <div className="p-4 border-2 border-[#F9F9F7]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-4 border-[#404040] border-t-[#CC0000]"
                    />
                  </div>
                  <div>
                    <h3
                      className="font-black text-2xl uppercase tracking-widest"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      LOADING NOTIFICATIONS
                    </h3>
                    <p
                      className="text-[#A3A3A3] text-sm mt-1"
                      style={{ fontFamily: "'Lora', serif" }}
                    >
                      Fetching your alerts and updates, please wait...
                    </p>
                  </div>
                </div>

                <div className="border border-[#404040] p-4 text-center min-w-[120px]">
                  <p
                    className="text-[0.65rem] text-[#A3A3A3] uppercase tracking-widest mb-1"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    STATUS
                  </p>
                  <p className="font-bold text-sm">SYNCING...</p>
                </div>
              </div>

              <div className="flex gap-2">
                {[0, 25, 50, 75].map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 flex-1 bg-[#CC0000] border border-[#CC0000]"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ERROR ───────────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!loading && error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 md:p-12 border-b-4 border-[#CC0000] bg-[#F9F9F7] newsprint-texture"
            >
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="p-4 border-2 border-[#CC0000] bg-[#CC0000] text-[#F9F9F7]">
                  <FaExclamationTriangle className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3
                    className="font-black text-2xl text-[#CC0000] uppercase"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    LOAD FAILED
                  </h3>
                  <p
                    className="text-[#111111] mt-2 font-bold"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {error}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <button
                      onClick={() => setError(null)}
                      className="px-6 py-3 border-2 border-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#E5E5E0] transition-colors text-[#111111]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      DISMISS
                    </button>
                    <button
                      onClick={fetchNotifications}
                      className="px-6 py-3 bg-[#CC0000] text-[#F9F9F7] font-black uppercase text-xs tracking-widest hover:bg-[#990000] transition-colors flex items-center gap-2"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <FaSync /> RETRY
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="p-2 border border-[#111111] hover:bg-[#E5E5E0] text-[#111111] transition-colors"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── EMPTY STATE ─────────────────────────────────────────────────────── */}
        {!loading && !error && filteredNotifications.length === 0 && (
          <div className="p-8 md:p-16">
            <div className="text-center py-16 border-2 border-dashed border-[#111111] max-w-md mx-auto">
              <div className="mx-auto w-16 h-16 border-4 border-[#111111] bg-[#111111] text-[#F9F9F7] flex items-center justify-center mb-6">
                <FaBellSlash className="text-2xl" />
              </div>
              <h3
                className="text-2xl font-black text-[#111111] mb-2 uppercase tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                INBOX CLEAR
              </h3>
              <p
                className="text-[#525252] max-w-md mx-auto mb-8"
                style={{ fontFamily: "'Lora', serif" }}
              >
                {filter !== 'all'
                  ? `No ${filter.toLowerCase()} notifications to display.`
                  : "You're fully up to date. No new notifications."}
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="px-8 py-4 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  VIEW ALL
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── NOTIFICATION FEED ───────────────────────────────────────────────── */}
        {!loading && !error && filteredNotifications.length > 0 && (
          <div>

            {/* Dark section header — matches RecoveryPanel / SyncHistoryPanel in BackUp */}
            <div className="bg-[#111111] text-[#F9F9F7] p-8 md:p-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
                <div className="flex items-center gap-6">
                  <div className="p-4 border-2 border-[#F9F9F7] bg-[#F9F9F7] text-[#111111]">
                    <HiBellAlert className="h-8 w-8" />
                  </div>
                  <div>
                    <h3
                      className="text-3xl font-black tracking-tighter uppercase"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      NOTIFICATION FEED
                    </h3>
                    <p
                      className="text-[#A3A3A3] mt-1 max-w-md"
                      style={{ fontFamily: "'Lora', serif" }}
                    >
                      {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} — {unreadCount} unread
                    </p>
                  </div>
                </div>

                {/* Read progress bar on desktop */}
                {notifications.length > 0 && (
                  <div className="hidden md:block min-w-[200px]">
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
                    <div className="w-full h-2 border border-[#404040] bg-[#222222]">
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

                <button
                  className="text-[0.65rem] font-bold text-[#F9F9F7] uppercase tracking-widest border border-[#F9F9F7] px-4 py-2 hover:bg-[#F9F9F7] hover:text-[#111111] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  SORTED: {sortBy === 'priority' ? 'PRIORITY' : 'DATE'} &rarr;
                </button>
              </div>
            </div>

            {/* ── NOTIFICATION CARDS ─────────────────────────────────────────── */}
            <AnimatePresence mode="popLayout">
              <div className="p-6 md:p-8 space-y-4">
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={{ duration: 0.18, delay: index * 0.025 }}
                    className="border-2 border-[#111111] bg-white hard-shadow-hover transition-all"
                    style={!notification.isRead
                      ? { borderLeftColor: '#CC0000', borderLeftWidth: '6px' }
                      : {}}
                  >
                    <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-5">

                      {/* Icon box */}
                      {getIcon(notification.type)}

                      {/* Content */}
                      <div className="flex-1 min-w-0">

                        {/* Title row + priority badge */}
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#111111] pb-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                              <h3
                                className={`font-black text-xl tracking-tight leading-snug ${!notification.isRead ? 'text-[#111111]' : 'text-[#525252]'}`}
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
                              className="text-[#525252] text-sm leading-relaxed"
                              style={{ fontFamily: "'Lora', serif" }}
                            >
                              {notification.message}
                            </p>
                          </div>

                          {/* Priority badge */}
                          <span
                            className={`text-[0.65rem] px-2 py-1 border font-black uppercase tracking-widest flex-shrink-0 ${getPriorityStyles(notification.priority)}`}
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {notification.priority.toUpperCase()}
                          </span>
                        </div>

                        {/* Expiry metadata */}
                        {notification.metadata?.expiryFormatted && (
                          <div
                            className="mb-4 text-[0.65rem] text-[#CC0000] font-black uppercase tracking-widest"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            EXPIRES: {notification.metadata.expiryFormatted}
                            {notification.metadata.daysUntilExpiry !== undefined &&
                              ` — ${notification.metadata.daysUntilExpiry}D REMAINING`}
                          </div>
                        )}

                        {/* Footer row */}
                        <div className="flex items-center justify-between flex-wrap gap-3">

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
                              className="text-[0.65rem] px-2 py-1 border border-[#A3A3A3] text-[#737373] uppercase tracking-widest"
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
                                className="flex items-center gap-1 text-[0.65rem] text-[#CC0000] uppercase tracking-widest font-bold"
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
                                className="px-4 py-2.5 bg-[#111111] text-[#F9F9F7] font-black uppercase text-[0.6rem] tracking-widest hover:bg-[#CC0000] transition-colors flex items-center gap-1.5"
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
                                className="p-2.5 border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors duration-200"
                              >
                                <FaEye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => deleteNotification(notification._id)}
                              title="Delete"
                              className="p-2.5 border-2 border-[#111111] text-[#111111] hover:bg-[#CC0000] hover:text-[#F9F9F7] hover:border-[#CC0000] transition-colors duration-200"
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
                  <div className="pt-4 flex justify-center">
                    <button
                      onClick={() => setFilter('all')}
                      className="px-8 py-4 border-2 border-[#111111] text-[#111111] font-black uppercase text-xs tracking-widest hover:bg-[#111111] hover:text-[#F9F9F7] transition-colors flex items-center gap-2"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <FaBell /> VIEW ALL NOTIFICATIONS
                    </button>
                  </div>
                )}
              </div>
            </AnimatePresence>
          </div>
        )}

      </div>
    </>
  );
};

export default Notifications;