import { useEffect, useState } from 'react';
import { Accessibility, AudioLines, Check, Languages, Save, ShieldCheck, SlidersHorizontal, UsersRound } from 'lucide-react';
import FeatureHeader from '../components/FeatureHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api, { apiMessage } from '../services/api.js';
import { enqueue } from '../services/offlineQueue.js';
import { LANGUAGES } from '../constants/languages.js';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [accessibility, setAccessibility] = useState(user?.accessibility || {});
  const [language, setLanguageValue] = useState(user?.language || 'en');
  const [languages, setLanguages] = useState([]);
  const [skills, setSkills] = useState('');
  const [schedule, setSchedule] = useState([]);
  const [scheduleSlot, setScheduleSlot] = useState({ day: 1, start: '09:00', end: '17:00' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setAccessibility(user?.accessibility || {});
    setLanguageValue(user?.language || 'en');
  }, [user]);
  useEffect(() => {
    if (user?.role !== 'VOLUNTEER') return;
    api.get('/volunteers/me').then(({ data }) => {
      setLanguages(data.data.volunteer.languages || []);
      setSkills((data.data.volunteer.skills || []).join(', '));
      setSchedule(data.data.volunteer.schedule || []);
    }).catch((problem) => setError(apiMessage(problem)));
  }, [user?.role]);

  const toggle = (key) => setAccessibility((previous) => ({ ...previous, [key]: !previous[key] }));

  const save = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const payload = { language, accessibility };
    try {
      if (!navigator.onLine) {
        await enqueue('PREFERENCES', payload, user.id);
        updateUser({ ...user, ...payload });
        localStorage.setItem('bala-language', language);
        setMessage('Settings saved on this device. They will sync when you are online.');
      } else {
        const response = await api.put('/users/preferences', payload);
        updateUser(response.data.data.user);
        localStorage.setItem('bala-language', language);
        setMessage('Your accessibility settings are saved.');
      }
      if (user.role === 'VOLUNTEER' && navigator.onLine) {
        await api.put('/volunteers/profile', {
          languages,
          skills: skills.split(',').map((skill) => skill.trim()).filter(Boolean),
          schedule,
        });
      } else if (user.role === 'VOLUNTEER') {
        setMessage('Accessibility settings are saved on this device. Volunteer profile changes need an internet connection.');
      }
    } catch (problem) {
      setError(apiMessage(problem));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tool-page">
      <FeatureHeader titleKey="settingsTitle" description="Make BALA feel easier to use. Your choices stay with your account." icon={Accessibility} />
      <div className="settings-grid">
        <section className="tool-card settings-card"><div className="settings-title"><Languages size={19} /><div><h2>Language & voice</h2><p>Choose how BALA talks and reads aloud.</p></div></div>
          <label htmlFor="settings-language">Preferred language</label><select id="settings-language" value={language} onChange={(event) => setLanguageValue(event.target.value)}>{LANGUAGES.map((option) => <option value={option.code} key={option.code}>{option.label} · {option.native}</option>)}</select>
          <label htmlFor="speech-rate">Speech rate <span>{Number(accessibility.speechRate || 1).toFixed(1)}×</span></label><input id="speech-rate" type="range" min="0.5" max="1.5" step="0.1" value={accessibility.speechRate || 1} onChange={(event) => setAccessibility((previous) => ({ ...previous, speechRate: Number(event.target.value) }))} />
          <p className="privacy-note"><AudioLines size={14} />The best voice depends on what your browser and device provide.</p>
        </section>
        <section className="tool-card settings-card"><div className="settings-title"><SlidersHorizontal size={19} /><div><h2>Display & comfort</h2><p>Personalize the way your screen feels.</p></div></div>
          <label className="setting-toggle"><span><strong>High contrast</strong><small>Increase contrast between text and backgrounds</small></span><input type="checkbox" checked={!!accessibility.highContrast} onChange={() => toggle('highContrast')} /></label>
          <label className="setting-toggle"><span><strong>Larger text</strong><small>Scale up interface text</small></span><input type="checkbox" checked={!!accessibility.largeText} onChange={() => toggle('largeText')} /></label>
          <label className="setting-toggle"><span><strong>Reduce motion</strong><small>Limit decorative transitions and movement</small></span><input type="checkbox" checked={!!accessibility.reducedMotion} onChange={() => toggle('reducedMotion')} /></label>
        </section>
        {user.role === 'VOLUNTEER' && <section className="tool-card settings-card volunteer-preferences"><div className="settings-title"><UsersRound size={19} /><div><h2>Volunteer profile</h2><p>Let people know how you can help.</p></div></div><fieldset><legend>Languages you can support</legend><div className="checkbox-group">{LANGUAGES.map((option) => <label className="checkbox-row" key={option.code}><input type="checkbox" checked={languages.includes(option.code)} onChange={(event) => setLanguages((previous) => event.target.checked ? [...previous, option.code] : previous.filter((item) => item !== option.code))} />{option.label}</label>)}</div></fieldset><label htmlFor="skills">Skills <span>comma separated</span></label><input id="skills" value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Reading, wayfinding…" /><fieldset className="schedule-fieldset"><legend>Weekly availability (local time)</legend><div className="schedule-editor"><label htmlFor="schedule-day">Day</label><select id="schedule-day" value={scheduleSlot.day} onChange={(event) => setScheduleSlot({ ...scheduleSlot, day: Number(event.target.value) })}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => <option value={index} key={day}>{day}</option>)}</select><label htmlFor="schedule-start">From</label><input id="schedule-start" type="time" value={scheduleSlot.start} onChange={(event) => setScheduleSlot({ ...scheduleSlot, start: event.target.value })} /><label htmlFor="schedule-end">Until</label><input id="schedule-end" type="time" value={scheduleSlot.end} onChange={(event) => setScheduleSlot({ ...scheduleSlot, end: event.target.value })} /><button className="button button-outline" type="button" onClick={() => setSchedule((previous) => [...previous, scheduleSlot])}>Add time</button></div><ul className="schedule-list">{schedule.map((slot, index) => <li key={`${slot.day}-${slot.start}-${index}`}><span>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][slot.day]} · {slot.start}–{slot.end}</span><button type="button" className="text-button" onClick={() => setSchedule((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></li>)}</ul></fieldset></section>}
      </div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      {message && <div className="success-note" role="status"><Check size={16} />{message}</div>}
      <div className="settings-save"><div><ShieldCheck size={17} /><span>Only your interface preferences are stored. No raw voice recordings are saved.</span></div><button type="button" className="button button-dark" onClick={save} disabled={busy}>{busy ? 'Saving…' : <><Save size={16} />Save settings</>}</button></div>
    </div>
  );
}
