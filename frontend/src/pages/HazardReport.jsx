import { useState } from 'react';
import { AlertTriangle, Check, MapPin, Send, ShieldAlert } from 'lucide-react';
import FeatureHeader from '../components/FeatureHeader.jsx';
import api, { apiMessage } from '../services/api.js';
import { enqueue } from '../services/offlineQueue.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useVoiceAssistant } from '../context/VoiceAssistantContext.jsx';
import { getCurrentLocation, getGeolocationErrorMessage } from '../utils/geolocation.js';

const categories = ['POTHOLE', 'CONSTRUCTION', 'BLOCKED_SIDEWALK', 'OBSTACLE', 'BROKEN_SIGNAL', 'UNSAFE_CROSSING', 'OTHER'];

export default function HazardReport() {
  const { user } = useAuth();
  const voice = useVoiceAssistant();
  const [category, setCategory] = useState('POTHOLE');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const getLocation = async () => {
    setLocating(true);
    setLocation(null);
    setError('');
    setMessage('');
    try {
      const coords = await getCurrentLocation({ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
      setLocation({ latitude: coords.latitude, longitude: coords.longitude });
      voice.speak('Your current location is ready for this hazard report.');
    } catch (problem) {
      const message = problem?.message || getGeolocationErrorMessage(problem);
      setError(message);
      voice.speak(message);
    } finally {
      setLocating(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const payload = { category, description: description.trim(), ...location };
    try {
      if (!navigator.onLine) {
        const queued = await enqueue('HAZARD_REPORT', payload, user.id);
        const confirmation = `Saved on this device for sync when you're back online. Request ${queued.requestId.slice(0, 8)}.`;
        setMessage(confirmation);
        voice.speak(confirmation);
      } else {
        await api.post('/hazards', payload);
        const confirmation = 'Your report was sent to the moderation queue. It will appear on the public map only if verified.';
        setMessage(confirmation);
        voice.speak(confirmation);
      }
      setDescription('');
      setLocation(null);
    } catch (problem) {
      const errorMessage = problem.response ? apiMessage(problem) : `This report could not be safely saved offline: ${problem.message}`;
      setError(errorMessage);
      voice.speak(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tool-page">
      <FeatureHeader titleKey="hazardTitle" description="Help the community spot an accessibility issue. A report stays private until a moderator verifies it." icon={ShieldAlert} />
      <div className="tool-layout hazard-form-layout">
        <form className="tool-card form-card" onSubmit={submit}>
          <h2>What did you notice?</h2>
          <label htmlFor="hazard-category">Type of hazard</label>
          <select id="hazard-category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option value={item} key={item}>{item.replaceAll('_', ' ').toLowerCase()}</option>)}</select>
          <label htmlFor="hazard-description">Description</label>
          <textarea id="hazard-description" required minLength={3} maxLength={500} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe what someone might encounter…" />
          <div className="char-count">{description.length}/500</div>
          <fieldset className="location-fieldset"><legend>Report location</legend><p>Your location is only requested after you press this button.</p><button type="button" className="button button-outline" onClick={getLocation} disabled={locating || busy}><MapPin size={16} />{locating ? 'Getting your location…' : location ? 'Update location' : 'Use my current location'}</button>{locating && <span className="location-status" role="status">Waiting for your browser’s location fix…</span>}{location && <span className="location-status"><Check size={14} />Location ready. Coordinates are private to moderators.</span>}</fieldset>
          {error && <div className="inline-error" role="alert"><AlertTriangle size={16} />{error}</div>}
          {message && <div className="success-note" role="status"><Check size={16} />{message}</div>}
          <button className="button button-dark full-button" type="submit" disabled={busy || locating || !location}>{busy ? 'Sending…' : <><Send size={16} />Submit report</>}</button>
          {!navigator.onLine && <p className="privacy-note"><AlertTriangle size={15} />Offline reports are held in this browser until the connection returns. Do not use a shared device.</p>}
        </form>
        <aside className="side-card"><span className="side-card-icon"><ShieldCheckIcon /></span><h3>Verified before sharing</h3><p>A report is marked “pending” and only appears on the community map once an administrator verifies it.</p><div className="side-divider" /><h3>Your privacy</h3><p>Your name and contact details are not shown publicly. Precise coordinates are used only for the hazard report.</p></aside>
      </div>
    </div>
  );
}

function ShieldCheckIcon() {
  return <Check size={20} />;
}
