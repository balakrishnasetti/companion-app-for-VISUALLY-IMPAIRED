import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Accessibility, AudioLines, Bell, BookOpen, CircleHelp, Compass, FileText, Heart, Home, LogOut,
  MapPinned, Menu, Mic, Navigation, Settings, ShieldAlert, UsersRound, WalletCards, X, Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useSocket } from '../hooks/useSocket.js';
import api from '../services/api.js';
import Brand from './Brand.jsx';
import StatusPill from './StatusPill.jsx';
import { pendingActions, removeAction } from '../services/offlineQueue.js';
import { useBalaVoice } from '../hooks/useBalaVoice.js';
import { VoiceAssistantProvider } from '../context/VoiceAssistantContext.jsx';

const navItems = [
  { to: '/app', key: 'dashboard', icon: Home, end: true },
  { to: '/app/scene', key: 'scene', icon: Eye },
  { to: '/app/obstacles', key: 'obstacles', icon: Accessibility },
  { to: '/app/document', key: 'document', icon: FileText },
  { to: '/app/currency', key: 'currency', icon: WalletCards },
  { to: '/app/volunteers', key: 'volunteers', icon: UsersRound },
  { to: '/app/map', key: 'map', icon: MapPinned },
  { to: '/app/hazards', key: 'reportHazard', icon: ShieldAlert },
  { to: '/app/navigation', key: 'navigation', icon: Navigation },
  { to: '/app/learn', key: 'knowledge', icon: BookOpen },
  { to: '/app/sos', key: 'sos', icon: ShieldAlert },
  { to: '/app/contacts', key: 'contacts', icon: Heart },
  { to: '/app/notifications', key: 'notifications', icon: Bell },
  { to: '/app/settings', key: 'settings', icon: Settings },
];

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const socket = useSocket();
  const handleVoiceIntent = useCallback(
    (path, intent, phrase) => navigate(path, { state: { voiceIntent: intent, voicePhrase: phrase } }),
    [navigate],
  );
  const voice = useBalaVoice(handleVoiceIntent);
  const [menuOpen, setMenuOpen] = useState(false);
  const [network, setNetwork] = useState(navigator.onLine ? 'ONLINE' : 'OFFLINE');
  const [notice, setNotice] = useState('');
  const [unread, setUnread] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const admin = useMemo(() => user?.role === 'ADMIN', [user?.role]);
  const volunteer = user?.role === 'VOLUNTEER';
  const visibleNavItems = volunteer
    ? navItems.filter(({ key }) => ['dashboard', 'notifications', 'settings'].includes(key))
    : navItems;

  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) {
        setNetwork('OFFLINE');
        return;
      }
      setNetwork('SYNCING');
      try {
        const pending = await pendingActions(user.id);
        for (const action of pending) {
          try {
            await api.post('/offline/sync', action);
            await removeAction(action.requestId);
          } catch (error) {
            if (error.response?.status >= 400 && error.response.status < 500 && error.response.status !== 409) {
              setNotice(`A saved action could not be synced: ${error.response.data?.message || 'Please review it.'}`);
              continue;
            }
            break;
          }
        }
        const remaining = await pendingActions(user.id);
        setQueueCount(remaining.length);
        setNetwork(remaining.length ? 'SYNC FAILED' : pending.length ? 'SYNC COMPLETE' : 'ONLINE');
        if (!remaining.length && pending.length) setNotice('Your saved actions have synced.');
      } catch (error) {
        setNetwork('SYNC FAILED');
        setNotice(error.message);
      }
    };
    const online = () => sync();
    const offline = () => setNetwork('OFFLINE');
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    pendingActions(user.id).then((items) => setQueueCount(items.length)).catch(() => setQueueCount(0));
    if (navigator.onLine) sync();
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, [user.id]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => api.get('/notifications').then((result) => setUnread(result.data.data.unreadCount)).catch(() => {});
    const onNotification = (notification) => {
      setUnread((count) => count + 1);
      setNotice(notification.message);
    };
    refresh();
    socket.on('notification:new', onNotification);
    return () => socket.off('notification:new', onNotification);
  }, [socket]);

  useEffect(() => {
    if (!socket || user?.role !== 'USER') return undefined;
    const onVolunteerAccepted = ({ callId } = {}) => {
      if (typeof callId !== 'string') return;
      setNotice('A verified volunteer accepted your request. Opening the private call.');
      navigate(`/app/calls/${callId}`);
    };
    socket.on('volunteer:accepted', onVolunteerAccepted);
    return () => socket.off('volunteer:accepted', onVolunteerAccepted);
  }, [navigate, socket, user?.role]);

  const handleSignOut = async () => {
    voice.stop();
    await signOut();
    navigate('/');
  };

  return (
    <VoiceAssistantProvider value={voice}>
    <div className={`app-frame ${user?.accessibility?.highContrast ? 'high-contrast' : ''} ${user?.accessibility?.largeText ? 'large-text' : ''} ${user?.accessibility?.reducedMotion ? 'reduced-motion' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand"><Brand /></div>
        <div className="sidebar-label">{volunteer ? 'VOLUNTEER SPACE' : 'YOUR SPACE'}</div>
        <nav className="primary-nav">
          {visibleNavItems.map(({ to, key, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <Icon size={19} aria-hidden="true" />
              <span>{volunteer && key === 'dashboard' ? 'Volunteer home' : t(key)}</span>
              {key === 'notifications' && unread > 0 && <span className="nav-count" aria-label={`${unread} unread notifications`}>{unread}</span>}
            </NavLink>
          ))}
          {admin && (
            <NavLink to="/app/admin" onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <ShieldAlert size={19} aria-hidden="true" /><span>{t('admin')}</span>
            </NavLink>
          )}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <div className="sidebar-note-icon"><CircleHelp size={18} aria-hidden="true" /></div>
          {volunteer ? (
            <>
              <p>Your time and skills can make a real difference for someone.</p>
              <NavLink to="/app/settings">Update volunteer profile <span aria-hidden="true">↗</span></NavLink>
            </>
          ) : (
            <>
              <p>Need a hand? BALA is here whenever you are.</p>
              <NavLink to="/app/volunteers">Connect with a person <span aria-hidden="true">↗</span></NavLink>
            </>
          )}
        </div>
        <button type="button" className="sidebar-account" onClick={handleSignOut} aria-label={`${t('signOut')} ${user?.name}`}>
          <span className="avatar">{user?.name?.slice(0, 1).toUpperCase()}</span>
          <span className="account-copy"><strong>{user?.name}</strong><small>{user?.role?.toLowerCase()}</small></span>
          <LogOut size={17} aria-hidden="true" />
        </button>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button type="button" className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <div className="mobile-brand"><Brand compact /></div>
          <div className="topbar-left"><span className="eyebrow">YOUR ACCESSIBLE COMPANION</span><span className="topbar-welcome">{t('greeting')}, {user?.name?.split(' ')[0]}</span></div>
          <div className="topbar-actions">
            <StatusPill variant={network === 'ONLINE' || network === 'SYNC COMPLETE' ? 'success' : network === 'OFFLINE' ? 'warning' : 'neutral'}>
              <span className="status-dot" aria-hidden="true" />{network}
            </StatusPill>
            {queueCount > 0 && <span className="queue-count" aria-label={`${queueCount} saved actions awaiting sync`}>{queueCount} saved</span>}
            <button
              type="button"
              className={`icon-button voice-shortcut ${voice.state === 'LISTENING_FOR_BALA' ? 'voice-shortcut-active' : ''}`}
              onClick={() => voice.state === 'LISTENING_FOR_BALA' || voice.state === 'SPEAKING' ? voice.stop() : voice.start()}
              disabled={voice.state === 'PROCESSING'}
              aria-label={voice.state === 'LISTENING_FOR_BALA' ? 'Stop listening to BALA' : voice.state === 'SPEAKING' ? 'Stop BALA speaking' : 'Activate BALA'}
              aria-pressed={voice.state === 'LISTENING_FOR_BALA'}
            >
              {voice.state === 'LISTENING_FOR_BALA' ? <AudioLines size={19} aria-hidden="true" /> : <Mic size={19} aria-hidden="true" />}
              <span className="voice-shortcut-label">{voice.state === 'LISTENING_FOR_BALA' ? 'Listening' : 'Activate BALA'}</span>
            </button>
            <NavLink to="/app/notifications" className="icon-button notification-shortcut" aria-label={`${t('notifications')}${unread ? `, ${unread} unread` : ''}`}>
              <Bell size={19} aria-hidden="true" />{unread > 0 && <span className="notification-dot" aria-hidden="true" />}
            </NavLink>
          </div>
        </header>
        {notice && <div className="global-notice" role="status"><AudioLines size={17} aria-hidden="true" /><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={16} /></button></div>}
        {(voice.message || ['LISTENING_FOR_BALA', 'PROCESSING', 'SPEAKING', 'ERROR'].includes(voice.state)) && (
          <div className={`voice-assistant-status${voice.state === 'LISTENING_FOR_BALA' ? ' voice-assistant-listening' : ''}`} role="status" aria-live="polite">
            <AudioLines size={17} aria-hidden="true" />
            <span>{voice.state === 'LISTENING_FOR_BALA'
              ? 'Listening on this device. Speak naturally; I will transcribe after you pause, or press the microphone to finish sooner.'
              : voice.state === 'PROCESSING'
                ? voice.message || 'Transcribing your command on this device…'
                : voice.message || (voice.state === 'SPEAKING' ? 'BALA is speaking.' : 'BALA voice assistant is ready.')}</span>
            {voice.transcript && <span className="voice-assistant-transcript">Heard: “{voice.transcript}”</span>}
          </div>
        )}
        <main id="main-content" className="page-content" tabIndex="-1"><Outlet /></main>
        <footer className="app-footer"><span>Made with care for a world that includes everyone.</span><span>Voice · vision · a little more independence</span></footer>
      </div>
      {menuOpen && <button type="button" className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    </div>
    </VoiceAssistantProvider>
  );
}
