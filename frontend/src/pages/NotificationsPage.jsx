import { useCallback, useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Clock3, Heart, MapPin, MessageCircle, ShieldAlert, Video } from 'lucide-react';
import FeatureHeader from '../components/FeatureHeader.jsx';
import StatusPill from '../components/StatusPill.jsx';
import api, { apiMessage } from '../services/api.js';
import { useSocket } from '../hooks/useSocket.js';

const iconFor = (type) => ({
  VOLUNTEER_REQUEST: UsersIcon,
  VOLUNTEER_ACCEPTED: UsersIcon,
  CALL_STARTED: Video,
  CALL_ENDED: Video,
  HAZARD_NEARBY: MapPin,
  HAZARD_VERIFIED: Check,
  SOS: ShieldAlert,
  FEEDBACK: Heart,
  SYSTEM: Bell,
}[type] || MessageCircle);

function UsersIcon() {
  return <Heart size={17} />;
}

export default function NotificationsPage() {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unreadCount);
    } catch (problem) {
      setError(apiMessage(problem));
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!socket) return undefined;
    const add = (notification) => {
      setNotifications((previous) => [notification, ...previous.filter((item) => item._id !== notification._id)]);
      setUnreadCount((count) => count + 1);
    };
    socket.on('notification:new', add);
    return () => socket.off('notification:new', add);
  }, [socket]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((previous) => previous.map((item) => item._id === id ? { ...item, readAt: new Date().toISOString() } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (problem) {
      setError(apiMessage(problem));
    }
  };

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((previous) => previous.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setUnreadCount(0);
    } catch (problem) {
      setError(apiMessage(problem));
    }
  };

  return (
    <div className="tool-page">
      <FeatureHeader titleKey="notificationsTitle" description="Updates about volunteer calls, verified hazards and your BALA account." icon={Bell} />
      <div className="section-subheading notification-subheading"><div><h2>Your inbox</h2><p>{unreadCount ? `${unreadCount} unread` : 'You are all caught up.'}</p></div>{unreadCount > 0 && <button type="button" className="button button-outline" onClick={markAll}><CheckCheck size={15} />Mark all read</button>}</div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      {notifications.length ? <ul className="notification-list">{notifications.map((notification) => { const Icon = iconFor(notification.type); return <li key={notification._id} className={notification.readAt ? 'notification-read' : 'notification-unread'}><span className="notification-icon"><Icon size={18} /></span><div className="notification-copy"><div><StatusPill>{notification.type.replaceAll('_', ' ').toLowerCase()}</StatusPill>{!notification.readAt && <span className="unread-label">NEW</span>}</div><p>{notification.message}</p><small><Clock3 size={13} />{new Date(notification.createdAt).toLocaleString()}</small></div>{!notification.readAt && <button type="button" className="icon-button" onClick={() => markRead(notification._id)} aria-label="Mark notification as read"><Check size={16} /></button>}</li>; })}</ul> : <div className="empty-state large-empty"><Bell size={21} /><p>No notifications yet. Important updates will appear here.</p></div>}
    </div>
  );
}
