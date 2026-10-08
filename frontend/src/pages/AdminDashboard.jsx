import { useCallback, useEffect, useState } from 'react';
import { Activity, Bell, Check, Heart, MapPinned, RefreshCw, ShieldCheck, ShieldOff, Siren, Star, UsersRound } from 'lucide-react';
import FeatureHeader from '../components/FeatureHeader.jsx';
import StatusPill from '../components/StatusPill.jsx';
import api, { apiMessage } from '../services/api.js';

const views = [
  { key: 'users', label: 'Users', icon: UsersRound },
  { key: 'volunteers', label: 'Volunteers', icon: ShieldCheck },
  { key: 'hazards', label: 'Hazards', icon: MapPinned },
  { key: 'feedback', label: 'Feedback', icon: Star },
  { key: 'sos', label: 'SOS events', icon: Siren },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'activity', label: 'System activity', icon: Activity },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [records, setRecords] = useState({});
  const [tab, setTab] = useState('users');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const [dashboard, users, volunteers, hazards, feedback, sos, notifications, logs] = await Promise.all([
        api.get('/admin/dashboard'), api.get('/admin/users'), api.get('/admin/volunteers'),
        api.get('/admin/hazards'), api.get('/admin/feedback'), api.get('/admin/sos'),
        api.get('/admin/notifications'), api.get('/admin/audit-logs'),
      ]);
      setStats(dashboard.data.data.stats);
      setActivity(dashboard.data.data.activity);
      setRecords({
        users: users.data.data.users,
        volunteers: volunteers.data.data.volunteers,
        hazards: hazards.data.data.hazards,
        feedback: feedback.data.data.feedback,
        sos: sos.data.data.events,
        notifications: notifications.data.data.notifications,
        activity: logs.data.data.logs,
      });
    } catch (problem) {
      setError(apiMessage(problem));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const moderateVolunteer = async (id, verified) => {
    try {
      await api.put(`/admin/volunteers/${id}/verify`, { verified });
      await load();
    } catch (problem) {
      setError(apiMessage(problem));
    }
  };
  const moderateHazard = async (id, status) => {
    try {
      await api.put(`/admin/hazards/${id}/verify`, { status });
      await load();
    } catch (problem) {
      setError(apiMessage(problem));
    }
  };
  const toggleAccount = async (id, status) => {
    try {
      await api.put(`/admin/users/${id}/status`, { status: status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' });
      await load();
    } catch (problem) {
      setError(apiMessage(problem));
    }
  };
  const moderateFeedback = async (id) => {
    try {
      await api.put(`/feedback/${id}/moderate`);
      await load();
    } catch (problem) {
      setError(apiMessage(problem));
    }
  };

  const statCards = [
    ['Total users', stats?.totalUsers, UsersRound], ['Verified volunteers', stats?.verifiedVolunteers, ShieldCheck],
    ['Pending volunteers', stats?.pendingVolunteers, ShieldOff], ['Active calls', stats?.activeCalls, Activity],
    ['Hazard reports', stats?.hazardReports, MapPinned], ['Verified hazards', stats?.verifiedHazards, Check],
    ['Pending hazards', stats?.pendingHazards, MapPinned], ['SOS events', stats?.sosEvents, Siren],
    ['Feedback', stats?.feedback, Heart],
  ];

  return (
    <div className="tool-page admin-page">
      <FeatureHeader eyebrow="RESTRICTED · ADMIN" titleKey="adminTitle" description="Manage accounts, verify community reports and review activity. Every action is recorded." icon={ShieldCheck} />
      {error && <div className="inline-error" role="alert">{error}</div>}
      <div className="admin-stat-grid">{statCards.map(([label, value, Icon]) => <article className="admin-stat-card" key={label}><span><Icon size={17} /></span><strong>{value ?? '—'}</strong><small>{label}</small></article>)}</div>
      <section className="admin-records tool-card">
        <div className="section-subheading"><div><h2>Management & review</h2><p>Private administration tools, visible only to verified administrators.</p></div><button type="button" className="button button-outline" onClick={load} disabled={busy}><RefreshCw size={15} />Refresh</button></div>
        <div className="admin-tabs" role="tablist" aria-label="Admin sections">{views.map(({ key, label, icon: Icon }) => <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'admin-tab admin-tab-active' : 'admin-tab'} onClick={() => setTab(key)}><Icon size={15} />{label}</button>)}</div>
        <div role="tabpanel" className="admin-table-wrap">{renderTab(tab, records, { moderateVolunteer, moderateHazard, toggleAccount, moderateFeedback })}</div>
      </section>
      <section className="tool-card activity-preview"><div className="section-subheading"><div><h2>Recent system activity</h2><p>Security-sensitive moderation events.</p></div><Activity size={18} /></div>{activity.length ? activity.slice(0, 5).map((entry) => <div className="activity-line" key={entry._id}><span><strong>{entry.action.replaceAll('_', ' ').toLowerCase()}</strong><small>{entry.actor?.name || 'System'} · {new Date(entry.createdAt).toLocaleString()}</small></span><StatusPill>{entry.resourceType || 'system'}</StatusPill></div>) : <p className="empty-state">No system activity has been recorded.</p>}</section>
    </div>
  );
}

function renderTab(tab, records, actions) {
  const empty = (text) => <p className="empty-state">{text}</p>;
  if (tab === 'users') return records.users?.length ? <table><caption className="sr-only">BALA user accounts</caption><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{records.users.map((user) => <tr key={user._id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td><StatusPill variant={user.status === 'ACTIVE' ? 'success' : 'warning'}>{user.status}</StatusPill></td><td><button type="button" className="text-button" onClick={() => actions.toggleAccount(user._id, user.status)}>{user.status === 'ACTIVE' ? 'Suspend account' : 'Restore account'}</button></td></tr>)}</tbody></table> : empty('No user accounts found.');
  if (tab === 'volunteers') return records.volunteers?.length ? <table><caption className="sr-only">Volunteer verification list</caption><thead><tr><th>Volunteer</th><th>Languages</th><th>Rating</th><th>Verification</th><th>Action</th></tr></thead><tbody>{records.volunteers.map((item) => <tr key={item._id}><td><strong>{item.user?.name}</strong><small>{item.user?.email}</small></td><td>{item.languages?.join(', ').toUpperCase() || '—'}</td><td>{item.rating?.toFixed(1) || 'New'}</td><td><StatusPill variant={item.verified ? 'success' : 'warning'}>{item.verified ? 'Verified' : 'Pending'}</StatusPill></td><td>{item.verified ? <button type="button" className="text-button" onClick={() => actions.moderateVolunteer(item._id, false)}>Revoke</button> : <button type="button" className="text-button" onClick={() => actions.moderateVolunteer(item._id, true)}>Verify volunteer</button>}</td></tr>)}</tbody></table> : empty('No volunteer registrations found.');
  if (tab === 'hazards') return records.hazards?.length ? <table><caption className="sr-only">Accessibility hazard reports</caption><thead><tr><th>Category</th><th>Description</th><th>Reported</th><th>Status</th><th>Review</th></tr></thead><tbody>{records.hazards.map((hazard) => <tr key={hazard.id}><td>{hazard.category.replaceAll('_', ' ').toLowerCase()}</td><td>{hazard.description}<small>{hazard.latitude.toFixed(3)}, {hazard.longitude.toFixed(3)}</small></td><td>{new Date(hazard.createdAt).toLocaleDateString()}</td><td><StatusPill>{hazard.status}</StatusPill></td><td>{hazard.status === 'PENDING' && <span className="table-actions"><button type="button" className="text-button" onClick={() => actions.moderateHazard(hazard.id, 'VERIFIED')}>Verify</button><button type="button" className="text-button text-danger" onClick={() => actions.moderateHazard(hazard.id, 'REJECTED')}>Reject</button></span>}{hazard.status === 'VERIFIED' && <button type="button" className="text-button" onClick={() => actions.moderateHazard(hazard.id, 'RESOLVED')}>Resolve</button>}</td></tr>)}</tbody></table> : empty('No hazard reports found.');
  if (tab === 'feedback') return records.feedback?.length ? <table><caption className="sr-only">User feedback</caption><thead><tr><th>Rating</th><th>Comment</th><th>From</th><th>Volunteer</th><th>Moderation</th></tr></thead><tbody>{records.feedback.map((item) => <tr key={item._id}><td><Star size={14} fill="currentColor" /> {item.rating}/5</td><td>{item.moderated ? '[Moderated]' : item.comment || 'No comment'}</td><td>{item.user?.name}</td><td>{item.volunteer?.name}</td><td>{item.moderated ? 'Reviewed' : <button type="button" className="text-button" onClick={() => actions.moderateFeedback(item._id)}>Moderate</button>}</td></tr>)}</tbody></table> : empty('No feedback received.');
  if (tab === 'sos') return records.sos?.length ? <table><caption className="sr-only">Emergency event history</caption><thead><tr><th>Member</th><th>Time</th><th>Status</th><th>Contact delivery</th></tr></thead><tbody>{records.sos.map((item) => <tr key={item._id}><td>{item.user?.name || 'Member'}</td><td>{new Date(item.createdAt).toLocaleString()}</td><td>{item.status}</td><td>{item.contactDelivery?.toLowerCase().replaceAll('_', ' ') || 'Not configured'}</td></tr>)}</tbody></table> : empty('No SOS events recorded.');
  if (tab === 'notifications') return records.notifications?.length ? <table><caption className="sr-only">Recent account notifications</caption><thead><tr><th>Member</th><th>Type</th><th>Message</th><th>Time</th></tr></thead><tbody>{records.notifications.map((item) => <tr key={item._id}><td>{item.user?.name}</td><td>{item.type}</td><td>{item.message}</td><td>{new Date(item.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table> : empty('No notifications found.');
  return records.activity?.length ? <table><caption className="sr-only">Security audit log</caption><thead><tr><th>Action</th><th>Actor</th><th>Resource</th><th>Time</th></tr></thead><tbody>{records.activity.map((item) => <tr key={item._id}><td>{item.action.replaceAll('_', ' ').toLowerCase()}</td><td>{item.actor?.name || 'System'}</td><td>{item.resourceType || '—'}</td><td>{new Date(item.createdAt).toLocaleString()}</td></tr>)}</tbody></table> : empty('No audit records found.');
}
