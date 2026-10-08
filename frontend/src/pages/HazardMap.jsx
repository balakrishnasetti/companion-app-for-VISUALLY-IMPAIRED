import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CircleHelp, LocateFixed, MapPin, MapPinned, RefreshCw, ShieldAlert } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import FeatureHeader from '../components/FeatureHeader.jsx';
import StatusPill from '../components/StatusPill.jsx';
import api, { apiMessage } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getCurrentLocation, getGeolocationErrorMessage } from '../utils/geolocation.js';

const fallbackCenter = [20.5937, 78.9629];
const tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const tileAttribution = import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function LocationMarker({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 14);
  }, [map, position]);
  return null;
}

export default function HazardMap() {
  const routeLocation = useLocation();
  const { language } = useLanguage();
  const [hazards, setHazards] = useState([]);
  const [position, setPosition] = useState(null);
  const [busy, setBusy] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const loadHazards = async (coords) => {
    setBusy(true);
    setError('');
    try {
      const response = await api.get(coords
        ? `/hazards/nearby?latitude=${coords.latitude}&longitude=${coords.longitude}&radius=10000`
        : '/hazards');
      setHazards(response.data.data.hazards);
    } catch (problem) {
      setError(apiMessage(problem));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { loadHazards(); }, []);

  const locate = () => {
    setLocating(true);
    setPosition(null);
    setHazards([]);
    setError('');
    getCurrentLocation({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 })
      .then(({ latitude, longitude }) => {
        const nextPosition = [latitude, longitude];
        setPosition(nextPosition);
        loadHazards({ latitude, longitude });
      })
      .catch((problem) => {
        setError(problem?.message || getGeolocationErrorMessage(problem));
      })
      .finally(() => {
        setLocating(false);
      });
  };

  useEffect(() => {
    const phrase = routeLocation.state?.voicePhrase || '';
    if (routeLocation.state?.voiceIntent === 'HAZARD_MAP' && /\b(?:near me|nearby|around me)\b/i.test(phrase)) {
      locate();
    }
  }, [routeLocation.key, routeLocation.state]);

  return (
    <div className="tool-page map-page">
      <FeatureHeader titleKey="mapTitle" description="Explore accessibility reports that have been verified by a moderator. Location is only requested if you choose to share it." icon={MapPinned} />
      <div className="map-toolbar"><div><StatusPill variant="success"><span className="status-dot" />Verified reports only</StatusPill><span className="map-result-count">{hazards.length} {hazards.length === 1 ? 'report' : 'reports'}</span></div><div className="map-buttons"><button type="button" className="button button-outline" onClick={locate} disabled={locating || busy}><LocateFixed size={16} />{locating ? 'Getting your location…' : 'Show near me'}</button><button type="button" className="button button-quiet" onClick={() => loadHazards(position && { latitude: position[0], longitude: position[1] })} disabled={busy || locating}><RefreshCw size={15} /> Refresh</button></div></div>
      {locating && <p className="location-status" role="status">Waiting for your browser’s location fix…</p>}
      {error && <div className="inline-error" role="alert">{error}</div>}
      <section className="map-card" aria-label="Map of verified accessibility hazards">
        <MapContainer center={position || fallbackCenter} zoom={position ? 14 : 5} scrollWheelZoom={false} className="hazard-map">
          <TileLayer attribution={tileAttribution} url={tileUrl} />
          <LocationMarker position={position} />
          {hazards.map((hazard) => <Marker key={hazard.id} position={[hazard.latitude, hazard.longitude]} icon={L.divIcon({ className: 'hazard-map-marker', html: '<span aria-hidden="true">!</span>', iconSize: [34, 34], iconAnchor: [17, 17] })}>
            <Popup><strong>{hazard.category.replaceAll('_', ' ').toLowerCase()}</strong><br />{hazard.description}<br /><small>Verified community report</small></Popup>
          </Marker>)}
        </MapContainer>
        {!hazards.length && !busy && <div className="map-empty"><MapPin size={20} /><span>No verified reports are showing here yet.</span></div>}
        {busy && <div className="map-loading" role="status">Loading verified reports…</div>}
      </section>
      <section className="map-report-list"><div className="section-subheading"><div><h2>Verified nearby reports</h2><p>Reporter identities are not shown on the map.</p></div></div>
        {hazards.length ? <ul className="hazard-list">{hazards.map((hazard) => <li key={hazard.id}><span className="hazard-category-icon"><ShieldAlert size={18} /></span><span className="hazard-copy"><strong>{hazard.category.replaceAll('_', ' ').toLowerCase()}</strong><span>{hazard.description}</span><small>{new Date(hazard.createdAt).toLocaleDateString(language)}</small></span><StatusPill variant="success">Verified</StatusPill></li>)}</ul> : <div className="empty-state"><CircleHelp size={19} /><p>{busy ? 'Checking for verified reports…' : 'There are no verified reports in this area yet.'}</p></div>}
      </section>
      <div className="caution-banner"><CircleHelp size={17} /><p>Reports may be out of date or incomplete. BALA cannot guarantee that a route is safe.</p></div>
    </div>
  );
}
