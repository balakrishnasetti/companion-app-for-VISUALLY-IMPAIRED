import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Clock3, Languages, Mic, RefreshCw, Send, Star, UsersRound, Video } from 'lucide-react';
import FeatureHeader from '../components/FeatureHeader.jsx';
import StatusPill from '../components/StatusPill.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useSocket } from '../hooks/useSocket.js';
import { isVolunteerConnectionRequest } from '../services/voiceCommands.js';
import api, { apiMessage } from '../services/api.js';

export default function VolunteerPage() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const handledVoiceLocationRef = useRef('');
  const humanFallbackStartedRef = useRef(false);
  const aiTimeoutRef = useRef(null);
  const aiAbortRef = useRef(null);
  const aiRequestIdRef = useRef(crypto.randomUUID());
  const [volunteers, setVolunteers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [calls, setCalls] = useState([]);
  const [availability, setAvailability] = useState('OFFLINE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [volunteerResponse, requestResponse, callResponse, selfResponse] = await Promise.all([
        api.get('/volunteers'),
        api.get('/volunteers/requests'),
        api.get('/calls'),
        ...(user?.role === 'VOLUNTEER' ? [api.get('/volunteers/me')] : [Promise.resolve({ data: { data: { volunteer: null } } })]),
      ]);
      setVolunteers(volunteerResponse.data.data.volunteers);
      setRequests(requestResponse.data.data.requests);
      setCalls(callResponse.data.data.calls);
      if (selfResponse.data.data.volunteer) setAvailability(selfResponse.data.data.volunteer.availability);
      const activeCall = callResponse.data.data.calls.find((call) => call.status !== 'ENDED');
      if (user?.role === 'USER' && activeCall) navigate(`/app/calls/${activeCall._id}`);
    } catch (problem) {
      setError(apiMessage(problem));
    } finally {
      setLoadingDirectory(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadData();
    if (!socket) return undefined;
    const refresh = () => loadData();
    socket.on('volunteer:request', refresh);
    const poll = window.setInterval(loadData, 15000);
    return () => {
      socket.off('volunteer:request', refresh);
      window.clearInterval(poll);
    };
  }, [loadData, socket, navigate]);

  const requestHelp = async () => {
    humanFallbackStartedRef.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/volunteers/requests', {
        requestId: aiRequestIdRef.current,
        topic: 'Live accessibility assistance',
        language: user.language,
      });
      const confirmation = response.data.data.request.status === 'ACCEPTED'
        ? 'A volunteer accepted your request. Opening the private call now.'
        : 'BALA can guide you with its accessibility tools, but it cannot join a live call as a volunteer. Your request is now in the verified human-volunteer queue. I will connect you automatically when someone accepts.';
      setMessage(confirmation);
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(confirmation);
        utterance.lang = locale;
        utterance.rate = user?.accessibility?.speechRate || 1;
        window.speechSynthesis.speak(utterance);
      }
      await loadData();
    } catch (problem) {
      humanFallbackStartedRef.current = false;
      setError(apiMessage(problem));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (location.state?.voiceIntent !== 'VOLUNTEER_REQUEST' || loadingDirectory || handledVoiceLocationRef.current === location.key) return;
    handledVoiceLocationRef.current = location.key;
    const phrase = location.state.voicePhrase || '';
    const explicitlyRequested = isVolunteerConnectionRequest(phrase);
    if (explicitlyRequested && user?.role === 'USER') {
      if (requests.some((item) => item.status === 'WAITING')) {
        setAiStatus('Your request is already waiting with a human volunteer. BALA will connect you when one accepts.');
        return;
      }
      setAiPrompt(phrase.replace(/^(?:hey\s+)?(?:bala|mala|baila|baala|balah|bye)[\s,.:;-]*/i, '').trim());
      setAiStatus('BALA received your voice request. Review it, then choose Ask AI volunteer first. If the AI does not respond within 60 seconds, BALA will send your request to human volunteers.');
      return;
    }
    if (user?.role !== 'USER') return;
    const names = volunteers.map((item) => item.user?.name).filter(Boolean);
    const summary = names.length
      ? `${names.length} verified volunteer${names.length === 1 ? '' : 's'} available: ${names.slice(0, 5).join(', ')}.`
      : 'No verified volunteers are available right now. You can still request help using the button.';
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(summary);
      utterance.lang = locale;
      utterance.rate = user?.accessibility?.speechRate || 1;
      window.speechSynthesis.speak(utterance);
    }
  }, [loadingDirectory, location.key, location.state, locale, requests, user, volunteers]);

  const sendToHuman = useCallback(async (reason) => {
    if (humanFallbackStartedRef.current) return;
    humanFallbackStartedRef.current = true;
    window.clearTimeout(aiTimeoutRef.current);
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setAiBusy(false);
    setAiStatus(`${reason} Sending your request to verified human volunteers now.`);
    await requestHelp();
  }, [requestHelp]);

  const askAiVolunteer = async (event) => {
    event.preventDefault();
    const prompt = aiPrompt.trim();
    if (!prompt || !aiConsent || aiBusy || humanFallbackStartedRef.current) return;
    if (requests.some((item) => item.status === 'WAITING')) {
      setAiStatus('Your request is already waiting with a human volunteer. BALA will connect you as soon as one accepts.');
      return;
    }

    setError('');
    setAiReply('');
    setAiBusy(true);
    setAiStatus('The AI volunteer has received your request. Waiting for a response; if none arrives within 60 seconds, BALA will send it to a human volunteer.');
    const controller = new AbortController();
    aiAbortRef.current = controller;
    aiTimeoutRef.current = window.setTimeout(() => {
      void sendToHuman('The AI volunteer did not respond within 60 seconds.');
    }, 60_000);

    try {
      const response = await api.post('/volunteers/ai-assist', {
        requestId: aiRequestIdRef.current,
        message: prompt,
        language: user.language,
        consent: aiConsent,
      }, { signal: controller.signal, timeout: 62_000 });
      if (humanFallbackStartedRef.current) return;
      window.clearTimeout(aiTimeoutRef.current);
      aiAbortRef.current = null;
      setAiBusy(false);
      if (response.data.data.fallback) {
        humanFallbackStartedRef.current = true;
        setAiStatus(`${response.data.data.message} BALA will connect you when a human volunteer accepts.`);
        await loadData();
        return;
      }
      setAiReply(response.data.data.reply);
      setAiStatus('The AI volunteer responded. If you still need a person, connect to a human volunteer below.');
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(response.data.data.reply);
        utterance.lang = locale;
        utterance.rate = user?.accessibility?.speechRate || 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch (problem) {
      if (humanFallbackStartedRef.current) return;
      if (controller.signal.aborted) return;
      window.clearTimeout(aiTimeoutRef.current);
      aiAbortRef.current = null;
      await sendToHuman(problem.response?.data?.message || 'The AI volunteer could not respond.');
    }
  };

  useEffect(() => () => {
    window.clearTimeout(aiTimeoutRef.current);
    aiAbortRef.current?.abort();
  }, []);

  const cancelHumanRequest = async () => {
    if (!waitingRequest) return;
    try {
      await api.put(`/volunteers/requests/${waitingRequest.id}/cancel`);
      humanFallbackStartedRef.current = false;
      aiRequestIdRef.current = crypto.randomUUID();
      await loadData();
      setMessage('Your waiting request was cancelled.');
    } catch (problem) {
      setError(apiMessage(problem));
    }
  };

  const updateAvailability = async (next) => {
    setBusy(true);
    setError('');
    try {
      const response = await api.put('/volunteers/availability', { availability: next });
      setAvailability(response.data.data.availability);
      socket?.emit('volunteer:availability', { available: next === 'AVAILABLE' });
    } catch (problem) {
      setError(apiMessage(problem));
    } finally {
      setBusy(false);
    }
  };

  const accept = async (requestId) => {
    setError('');
    try {
      const response = await api.put(`/volunteers/requests/${requestId}/accept`);
      navigate(`/app/calls/${response.data.data.callId}`);
    } catch (problem) {
      setError(apiMessage(problem));
      loadData();
    }
  };

  const volunteer = user?.role === 'VOLUNTEER';
  const activeRequests = requests.filter((item) => item.status === 'WAITING');
  const waitingRequest = requests.find((item) => item.status === 'WAITING');

  return (
    <div className="tool-page">
      <FeatureHeader titleKey={volunteer ? 'volunteerTitle' : 'findVolunteerTitle'} description={volunteer ? 'See new requests, set your availability and connect with someone who needs a hand.' : 'Request a private video call with a verified volunteer. A person will join when available.'} icon={UsersRound} />
      {error && <div className="inline-error" role="alert">{error}</div>}
      {message && <div className="success-note" role="status"><Check size={16} />{message}</div>}

      {volunteer ? (
        <div className="volunteer-grid">
          <section className="tool-card volunteer-status-card"><span className="feature-title-icon"><UsersRound size={20} /></span><h2>Availability</h2><p>Only verified volunteers can accept requests. You decide when you are ready.</p><StatusPill variant={availability === 'AVAILABLE' ? 'success' : 'neutral'}>{availability}</StatusPill><div className="button-row"><button className="button button-dark" type="button" onClick={() => updateAvailability('AVAILABLE')} disabled={busy}><Check size={15} />I'm available</button><button className="button button-outline" type="button" onClick={() => updateAvailability('OFFLINE')} disabled={busy}>Go offline</button></div><Link className="text-link" to="/app/settings">Edit languages and skills <ArrowRight size={15} /></Link></section>
          <section className="tool-card volunteer-queue"><div className="section-subheading"><div><h2>Waiting requests</h2><p>{activeRequests.length} people waiting</p></div><button type="button" className="icon-button" onClick={loadData} aria-label="Refresh requests"><RefreshCw size={17} /></button></div>{activeRequests.length ? activeRequests.map((item) => <article className="request-card" key={item.id}><span className="request-avatar">{item.user?.name?.slice(0, 1) || 'B'}</span><div><strong>{item.topic}</strong><span>{item.user?.name || 'BALA member'} · {item.language.toUpperCase()}</span><small><Clock3 size={13} />{new Date(item.createdAt).toLocaleTimeString()}</small></div><button type="button" className="button button-lime button-small" onClick={() => accept(item.id)} disabled={availability !== 'AVAILABLE'}><Video size={15} />Accept</button></article>) : <div className="empty-state"><Clock3 size={20} /><p>New requests will appear here. Keep your status current.</p></div>}</section>
          <section className="tool-card call-history-card"><h2>Recent calls</h2>{calls.length ? calls.slice(0, 5).map((call) => <div className="history-line" key={call._id}><span><strong>{call.user?.name || 'BALA member'}</strong><small>{new Date(call.createdAt).toLocaleDateString()}</small></span><StatusPill variant={call.status === 'ENDED' ? 'neutral' : 'success'}>{call.status.toLowerCase()}</StatusPill></div>) : <p className="empty-state">Your completed assistance sessions will appear here.</p>}</section>
        </div>
      ) : (
        <>
          <section className="tool-card ai-volunteer-card">
            <span className="side-card-icon"><UsersRound size={20} /></span>
            <h2>Start with the AI volunteer</h2>
            <p className="muted-copy">BALA’s AI helper can offer guidance first. It is not a human and cannot join a video call. If it cannot respond within 60 seconds, your request will be sent to verified human volunteers automatically.</p>
            <form className="ai-volunteer-form" onSubmit={askAiVolunteer}>
              <label htmlFor="ai-volunteer-request">What do you need help with?</label>
              <textarea id="ai-volunteer-request" rows={3} maxLength={1000} value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder="Describe what you need help with…" required disabled={aiBusy || !!waitingRequest} />
              <label className="ai-volunteer-consent"><input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} disabled={aiBusy} /><span>I agree to send this text request to the AI service configured for BALA. My microphone recording is not sent or stored.</span></label>
              <div className="button-row">
                <button type="submit" className="button button-lime" disabled={!aiPrompt.trim() || !aiConsent || aiBusy || !!waitingRequest}><Send size={16} />{aiBusy ? 'Waiting for AI volunteer…' : 'Ask AI volunteer first'}</button>
                <button type="button" className="button button-dark" onClick={() => void sendToHuman('You asked to connect with a person.')} disabled={busy || !!waitingRequest}><Video size={16} />Connect to a human now</button>
              </div>
            </form>
            {aiStatus && <p className="success-note" role="status" aria-live="polite">{aiStatus}</p>}
            {aiReply && <article className="ai-volunteer-reply" aria-live="polite"><strong>AI volunteer reply</strong><p>{aiReply}</p><button type="button" className="text-button" onClick={() => { if (window.speechSynthesis) { const utterance = new SpeechSynthesisUtterance(aiReply); utterance.lang = locale; window.speechSynthesis.speak(utterance); } }}>Read the reply aloud</button></article>}
          </section>
          <div className="volunteer-hero-card"><div className="volunteer-orb"><UsersRound size={31} /></div><div><span className="eyebrow">LIVE, ONE-TO-ONE ASSISTANCE</span><h2>Need a person?</h2><p>A verified human volunteer can join you in a private browser video call. Your camera turns on only when you join the call.</p></div><button type="button" className="button button-outline" onClick={() => void sendToHuman('You asked to connect with a person.')} disabled={busy || !!waitingRequest}>{busy ? 'Requesting…' : waitingRequest ? 'Request in queue' : <><Video size={16} />Request human volunteer</>}</button></div>
          {waitingRequest && <button type="button" className="text-button cancel-request" onClick={cancelHumanRequest}>Cancel waiting request</button>}
          <section className="volunteer-directory"><div className="section-subheading"><div><h2>Available volunteers</h2><p>Only moderator-verified volunteers are listed.</p></div><button type="button" className="button button-quiet" onClick={loadData}><RefreshCw size={15} />Refresh</button></div>
            {volunteers.length ? <div className="volunteer-cards">{volunteers.map((volunteerItem) => <article className="available-volunteer" key={volunteerItem._id}><span className="volunteer-avatar">{volunteerItem.user?.name?.slice(0, 1) || 'V'}</span><div><strong>{volunteerItem.user?.name || 'Verified volunteer'}</strong><span><StatusPill variant="success"><span className="status-dot" />Available</StatusPill><span className="volunteer-rating"><Star size={13} fill="currentColor" />{volunteerItem.rating?.toFixed(1) || 'New'}</span></span><small><Languages size={13} />{volunteerItem.languages?.join(', ').toUpperCase() || 'Languages on request'}</small></div></article>)}</div> : <div className="empty-state"><UsersRound size={20} /><p>{busy ? 'Looking for available volunteers…' : 'No volunteers are available right now. You can still request help and wait in the queue.'}</p></div>}
          </section>
          <section className="call-privacy-note"><Mic size={17} /><p>Your camera and microphone stay off until you join a call. You can mute, turn off video, or leave at any time.</p></section>
        </>
      )}
    </div>
  );
}
