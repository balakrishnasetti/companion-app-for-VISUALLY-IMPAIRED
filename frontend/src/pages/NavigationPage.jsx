import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, BellRing, Compass, ExternalLink, MapPin, Navigation } from 'lucide-react';
import FeatureHeader from '../components/FeatureHeader.jsx';
import { useVoiceAssistant } from '../context/VoiceAssistantContext.jsx';
import { extractNavigationDestination } from '../services/voiceCommands.js';
import { googleMapsWalkingDirectionsUrl } from '../services/googleMaps.js';
import api, { apiMessage } from '../services/api.js';
import { getCurrentLocation, getGeolocationErrorMessage } from '../utils/geolocation.js';

export default function NavigationPage() {
  const location = useLocation();
  const voice = useVoiceAssistant();
  const destinationInput = useRef(null);
  const [destination, setDestination] = useState('');
  const [position, setPosition] = useState(null);
  const [locating, setLocating] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const mapsUrl = googleMapsWalkingDirectionsUrl(destination, position);

  const requestAlerts = useCallback(async (coordinates, nextDestination = '') => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = nextDestination
        ? await api.post('/navigation/route', { destination: nextDestination, ...coordinates })
        : await api.get(`/navigation/alerts?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}`);
      const nextAlerts = nextDestination
        ? response.data.data.alerts.map((message, index) => ({ id: `${index}`, message }))
        : response.data.data.alerts;
      setAlerts(nextAlerts);
      const resultMessage = nextDestination
        ? response.data.data.notice
        : nextAlerts.length ? 'Nearby verified reports are listed below.' : 'No verified hazards were found nearby.';
      setNotice(resultMessage);
      voice.speak(resultMessage);
    } catch (problem) {
      const message = apiMessage(problem);
      setError(message);
      voice.speak(message);
    } finally {
      setBusy(false);
    }
  }, [voice.speak]);

  const getLocation = useCallback(({ nextDestination = '' } = {}) => {
    setLocating(true);
    setPosition(null);
    setAlerts([]);
    setError('');
    setNotice('');
    getCurrentLocation({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 })
      .then(({ latitude, longitude }) => {
        const coordinates = { latitude, longitude };
        setPosition(coordinates);
        void requestAlerts(coordinates, nextDestination);
      })
      .catch((problem) => {
        const message = problem?.message || getGeolocationErrorMessage(problem);
        setError(message);
        voice.speak(message);
      })
      .finally(() => {
        setLocating(false);
      });
  }, [requestAlerts, voice.speak]);

  const getAlerts = async () => {
    if (!position) return;
    await requestAlerts(position);
  };

  const begin = async (event) => {
    event.preventDefault();
    if (!position) {
      setError('Choose “Share my current location” before requesting nearby navigation alerts.');
      return;
    }
    await requestAlerts(position, destination);
  };

  const stopAlerts = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const response = await api.delete('/navigation/route');
      setPosition(null);
      setAlerts([]);
      setDestination('');
      setNotice(response.data.message);
      voice.speak(response.data.message);
    } catch (problem) {
      const message = apiMessage(problem);
      setError(message);
      voice.speak(message);
    } finally {
      setBusy(false);
    }
  }, [voice.speak]);

  useEffect(() => {
    const intent = location.state?.voiceIntent;
    if (intent === 'STOP_NAVIGATION') {
      void stopAlerts();
      return;
    }
    if (!['START_NAVIGATION', 'CURRENT_LOCATION', 'NAVIGATION'].includes(intent)) return;
    const phrase = location.state?.voicePhrase || '';
    const nextDestination = extractNavigationDestination(phrase);
    if (nextDestination) setDestination(nextDestination);
    window.requestAnimationFrame(() => destinationInput.current?.focus());
    getLocation({ nextDestination });
  }, [getLocation, location.key, location.state, stopAlerts]);

  return (
    <div className="tool-page">
      <FeatureHeader titleKey="navigationTitle" description="Check for verified hazards nearby, then open walking directions in Google Maps. Maps directions are not a guarantee that a route is accessible or safe." icon={Compass} />
      <div className="tool-layout">
        <section className="tool-card">
          <h2>Plan a route and check nearby alerts</h2>
          <p className="muted-copy">Press the location button to send your coordinates to BALA for nearby verified alerts. Coordinates are used for this request only. You can open a destination in Google Maps without sharing them with BALA.</p>
          <button type="button" className={`button ${position ? 'button-outline' : 'button-dark'}`} onClick={() => getLocation()} disabled={locating || busy}><MapPin size={16} />{locating ? 'Getting your location…' : position ? 'Update my location' : 'Share my current location'}</button>
          {locating && <p className="location-status" role="status">Waiting for your browser’s location fix…</p>}
          {position && <p className="location-status"><MapPin size={14} />Location available for this request.</p>}
          {position && <button type="button" className="text-button" onClick={stopAlerts} disabled={busy}>Stop location alerts and clear location</button>}
          <form className="destination-form" onSubmit={begin}><label htmlFor="destination">Destination</label><input ref={destinationInput} id="destination" value={destination} onChange={(event) => setDestination(event.target.value)} required minLength={2} maxLength={200} placeholder="Where are you heading?" /><button className="button button-lime" type="submit" disabled={busy || !position}>{busy ? 'Checking nearby hazards…' : <><Navigation size={16} />Check nearby alerts</>}</button></form>
          {mapsUrl && <a className="button button-dark google-maps-link" href={mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open walking directions to ${destination.trim()} in Google Maps${position ? ' from your current location' : ''}, opens in a new tab`}><ExternalLink size={16} />Open walking directions in Google Maps</a>}
          <button type="button" className="text-button" onClick={getAlerts} disabled={busy || !position}><BellRing size={15} />Check alerts at my location</button>
          {error && <div className="inline-error" role="alert"><AlertTriangle size={16} />{error}</div>}
          {notice && <div className="success-note" role="status">{notice}</div>}
        </section>
        <aside className="side-card"><span className="side-card-icon"><Compass size={20} /></span><h3>Location stays optional</h3><p>BALA only receives your coordinates after you press the share button. If you open Google Maps, the coordinates are added to its directions only after you choose to open that link.</p><div className="side-divider" /><h3>Check your route</h3><p>Google Maps supplies the walking directions. Map data can be incomplete, and BALA cannot verify step-free access, hazards, or safety. Continue using your usual mobility aids and judgement.</p></aside>
      </div>
      <section className="map-report-list"><div className="section-subheading"><div><h2>Nearby verified alerts</h2><p>Reports may be incomplete or out of date.</p></div></div>{alerts.length ? <ul className="alert-list">{alerts.map((alert) => <li key={alert.id}><span><AlertTriangle size={18} /></span><p>{alert.message}</p></li>)}</ul> : <p className="empty-state">Your nearby alert results will appear here.</p>}</section>
    </div>
  );
}
