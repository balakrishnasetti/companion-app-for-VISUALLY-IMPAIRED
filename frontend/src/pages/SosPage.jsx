import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Heart, MapPin, Phone, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import FeatureHeader from '../components/FeatureHeader.jsx';
import StatusPill from '../components/StatusPill.jsx';
import api, { apiMessage } from '../services/api.js';
import { useVoiceAssistant } from '../context/VoiceAssistantContext.jsx';
import { getCurrentLocation, getGeolocationErrorMessage } from '../utils/geolocation.js';

function TrustedContacts() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', relationship: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => api.get('/users/contacts').then((response) => setContacts(response.data.data.contacts)).catch((problem) => setError(apiMessage(problem)));
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await api.post('/users/contacts', form);
      setContacts((previous) => [...previous, response.data.data.contact]);
      setForm({ name: '', phone: '', relationship: '' });
    } catch (problem) {
      setError(apiMessage(problem));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/users/contacts/${id}`);
      setContacts((previous) => previous.filter((contact) => contact._id !== id));
    } catch (problem) {
      setError(apiMessage(problem));
    }
  };

  return (
    <div className="tool-page">
      <FeatureHeader titleKey="contactsTitle" description="People you choose to notify if you activate SOS. Phone numbers stay private." icon={Heart} />
      <div className="contacts-layout">
        <form className="tool-card form-card" onSubmit={submit}><h2>Add someone you trust</h2><label htmlFor="contact-name">Name</label><input id="contact-name" required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><label htmlFor="contact-phone">Phone number</label><input id="contact-phone" type="tel" inputMode="tel" required pattern="\+?[0-9 ()-]{7,24}" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+1 555 123 4567" /><label htmlFor="contact-relationship">Relationship <span>(optional)</span></label><input id="contact-relationship" maxLength={50} value={form.relationship} onChange={(event) => setForm({ ...form, relationship: event.target.value })} placeholder="Friend, family…" />{error && <div className="inline-error" role="alert">{error}</div>}<button className="button button-dark full-button" disabled={busy || contacts.length >= 10}><Plus size={16} />Add trusted contact</button><p className="privacy-note"><ShieldAlert size={15} />BALA only sends an SMS if the server owner has configured a supported messaging service.</p></form>
        <section className="tool-card contact-list-card"><div className="section-subheading"><div><h2>Your people</h2><p>Up to 10 private trusted contacts.</p></div><StatusPill>{contacts.length}/10</StatusPill></div>{contacts.length ? <ul className="contact-list">{contacts.map((contact) => <li key={contact._id}><span className="contact-avatar">{contact.name.slice(0, 1).toUpperCase()}</span><span><strong>{contact.name}</strong><small>{contact.relationship || 'Trusted contact'} · {contact.phone}</small></span><a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`} className="icon-button" aria-label={`Call ${contact.name}`}><Phone size={16} /></a><button type="button" className="icon-button delete-contact" aria-label={`Remove ${contact.name}`} onClick={() => remove(contact._id)}><Trash2 size={16} /></button></li>)}</ul> : <div className="empty-state"><Heart size={19} /><p>Add someone you trust. Their details will not appear publicly.</p></div>}</section>
      </div>
    </div>
  );
}

export function SosPage() {
  const voice = useVoiceAssistant();
  const [events, setEvents] = useState([]);
  const [confirm, setConfirm] = useState(false);
  const [shareLocation, setShareLocation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = () => api.get('/sos/history').then((response) => setEvents(response.data.data.events)).catch((problem) => setError(apiMessage(problem)));
  useEffect(() => { load(); }, []);

  const send = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const submitEvent = async (location) => {
      const response = await api.post('/sos', { requestId: crypto.randomUUID(), ...(location ? { location } : {}) });
      const { sos, contactDelivery } = response.data.data;
      const outcomes = {
        SENT: 'Your SOS was recorded and an SMS was accepted for delivery to your trusted contacts.',
        PARTIAL: 'Your SOS was recorded. Some trusted-contact messages could not be delivered.',
        FAILED: 'Your SOS was recorded, but contact messages could not be sent. Call emergency services if you are in danger.',
        NO_CONTACTS: 'Your SOS was recorded, but no trusted contacts are set up.',
        NOT_CONFIGURED: 'Your SOS was recorded, but contact messaging is not configured. BALA has not contacted emergency services.',
      };
      const confirmation = outcomes[contactDelivery] || outcomes.NOT_CONFIGURED;
      setMessage(confirmation);
      voice.speak(confirmation);
      setConfirm(false);
      setShareLocation(false);
      await load();
    };
    try {
      if (shareLocation) {
        try {
          const coords = await getCurrentLocation({ enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
          await submitEvent({ latitude: coords.latitude, longitude: coords.longitude });
          setBusy(false);
          return;
        } catch (problem) {
          const message = problem?.message || getGeolocationErrorMessage(problem);
          setError(message);
          try { await submitEvent(null); } catch (submitProblem) { setError(apiMessage(submitProblem)); }
          finally { setBusy(false); }
          return;
        }
      }
      await submitEvent(null);
    } catch (problem) {
      const errorMessage = apiMessage(problem);
      setError(errorMessage);
      voice.speak(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id) => {
    try {
      await api.post(`/sos/${id}/cancel`);
      await load();
    } catch (problem) {
      setError(apiMessage(problem));
    }
  };

  return (
    <div className="tool-page sos-page">
      <FeatureHeader titleKey="sosTitle" description="Record an SOS event and, if messaging is configured, alert your trusted contacts. This does not contact emergency services." icon={ShieldAlert} />
      <section className="sos-card"><div className="sos-card-icon"><AlertTriangle size={22} /></div><div><span className="eyebrow">WHEN YOU NEED YOUR PEOPLE</span><h2>Send a check-in for help.</h2><p>BALA records your request, and can send a text to your trusted contacts if SMS delivery has been set up by your administrator.</p><button type="button" className="button button-sos" onClick={() => { setConfirm(true); setError(''); }}>Send SOS</button></div></section>
      <div className="sos-disclaimer"><ShieldAlert size={17} /><p><strong>BALA is not an emergency dispatch service.</strong> If you may be in immediate danger, contact your local emergency services directly.</p></div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      {message && <div className="success-note" role="status"><Check size={16} />{message}</div>}
      <section className="sos-history"><div className="section-subheading"><div><h2>Emergency history</h2><p>Your SOS event history is private to your account.</p></div><StatusPill>{events.length} events</StatusPill></div>{events.length ? <ul className="sos-event-list">{events.map((event) => <li key={event._id}><span className="sos-event-icon"><Heart size={17} /></span><span><strong>Help request recorded</strong><small>{new Date(event.createdAt).toLocaleString()} · contacts: {event.contactDelivery?.toLowerCase().replaceAll('_', ' ') || 'not configured'}</small>{event.location && <small><MapPin size={12} />Location shared with contacts</small>}</span><StatusPill variant={event.status === 'ACTIVE' ? 'warning' : 'neutral'}>{event.status}</StatusPill>{event.status === 'ACTIVE' && <button type="button" className="text-button" onClick={() => cancel(event._id)}>Cancel</button>}</li>)}</ul> : <p className="empty-state">No SOS events have been recorded.</p>}</section>
      {confirm && <div className="modal-backdrop"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="sos-confirm-title" aria-describedby="sos-confirm-description"><span className="confirm-icon"><ShieldAlert size={21} /></span><h2 id="sos-confirm-title">Send an SOS now?</h2><p id="sos-confirm-description">This records the event in BALA. SMS delivery depends on server setup and does not contact emergency services.</p><label className="checkbox-row"><input type="checkbox" checked={shareLocation} onChange={(event) => setShareLocation(event.target.checked)} />Include my current location if available</label><p className="privacy-note"><MapPin size={14} />Location access is requested only after you confirm.</p><div className="button-row"><button type="button" className="button button-outline" onClick={() => setConfirm(false)}>Go back</button><button type="button" className="button button-sos" onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Confirm SOS'}</button></div></section></div>}
    </div>
  );
}

export default TrustedContacts;
