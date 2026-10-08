import { Link, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowRight, AudioLines, Ear, Eye, Heart, Languages, MapPinned, Mic, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { LANGUAGES } from '../constants/languages.js';
import Brand from '../components/Brand.jsx';
import { useOfflineSpeech } from '../hooks/useOfflineSpeech.js';
import { findVoiceIntent, normalizeVoiceCommand, VOICE_INTENT_PATHS } from '../services/voiceCommands.js';

const features = [
  { icon: Eye, title: 'See a little more', description: 'Get a careful, spoken description of what your camera sees. BALA shares uncertainty, not guarantees.' },
  { icon: AudioLines, title: 'Read it your way', description: 'Listen to documents, notes and currency in your selected language, including English, Telugu, Hindi and Spanish.' },
  { icon: UsersRound, title: 'A real person, when you need one', description: 'Request a verified volunteer for a private, one-to-one video call.' },
  { icon: MapPinned, title: 'Community knows the way', description: 'Share accessibility hazards and see reports that the community has verified.' },
];

const INTRO_STORAGE_KEY = 'bala-home-intro-seen';

function canShowIntro() {
  try {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && window.sessionStorage.getItem(INTRO_STORAGE_KEY) !== 'true';
  } catch {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

function EyeArtwork({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 640 440" role="img" aria-label="An original illustration of an eye, representing seeing the world in a new way">
      <defs>
        <linearGradient id="bala-eye-white" x1="0" y1="0" x2=".25" y2="1">
          <stop offset="0" stopColor="#b6c9dc" />
          <stop offset=".18" stopColor="#f7fbff" />
          <stop offset=".54" stopColor="#dce8f3" />
          <stop offset=".82" stopColor="#f4f8fc" />
          <stop offset="1" stopColor="#8298b1" />
        </linearGradient>
        <radialGradient id="bala-eye-iris">
          <stop offset="0" stopColor="#080e1d" />
          <stop offset=".25" stopColor="#111d37" />
          <stop offset=".36" stopColor="#9acfff" />
          <stop offset=".43" stopColor="#7397d5" />
          <stop offset=".65" stopColor="#2f70b4" />
          <stop offset=".82" stopColor="#153c76" />
          <stop offset=".94" stopColor="#72c8ed" />
          <stop offset="1" stopColor="#0d2145" />
        </radialGradient>
        <radialGradient id="bala-eye-glow">
          <stop offset="0" stopColor="#58aaff" stopOpacity=".42" />
          <stop offset=".65" stopColor="#347fe6" stopOpacity=".15" />
          <stop offset="1" stopColor="#8fcaff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bala-eye-iris-light" cx=".32" cy=".24" r=".82">
          <stop offset="0" stopColor="#fff" stopOpacity=".42" />
          <stop offset=".38" stopColor="#fff" stopOpacity=".08" />
          <stop offset="1" stopColor="#000b1d" stopOpacity=".48" />
        </radialGradient>
        <linearGradient id="bala-eye-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17253d" />
          <stop offset=".5" stopColor="#8da6c4" />
          <stop offset="1" stopColor="#263957" />
        </linearGradient>
        <filter id="bala-eye-blur">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <clipPath id="bala-eye-clip">
          <path d="M54 220Q320 22 586 220Q320 418 54 220Z" />
        </clipPath>
      </defs>
      <ellipse cx="320" cy="220" rx="245" ry="152" fill="#438cff" opacity=".24" filter="url(#bala-eye-blur)" />
      <ellipse cx="320" cy="220" rx="249" ry="173" fill="url(#bala-eye-glow)" />
      <path d="M42 220Q320 4 598 220Q320 436 42 220Z" fill="#091323" opacity=".9" />
      <path d="M54 220Q320 22 586 220Q320 418 54 220Z" fill="url(#bala-eye-white)" />
      <g clipPath="url(#bala-eye-clip)">
        <ellipse cx="320" cy="231" rx="117" ry="130" fill="#07101e" opacity=".4" />
        <circle cx="320" cy="218" r="121" fill="url(#bala-eye-iris)" />
        <circle cx="320" cy="218" r="121" fill="url(#bala-eye-iris-light)" />
        <circle cx="320" cy="218" r="116" fill="none" stroke="#96d7ff" strokeOpacity=".62" strokeWidth="2" />
        <circle cx="320" cy="218" r="91" fill="none" stroke="#b6ddff" strokeOpacity=".46" strokeWidth="2" />
        {Array.from({ length: 168 }, (_, index) => {
          const angle = index * 2.399963;
          const inner = 57 + (index * 19 % 20);
          const outer = 88 + (index * 37 % 28);
          const x1 = 320 + Math.cos(angle) * inner;
          const y1 = 218 + Math.sin(angle) * inner;
          const x2 = 320 + Math.cos(angle + Math.sin(index) * .012) * outer;
          const y2 = 218 + Math.sin(angle + Math.sin(index) * .012) * outer;
          const colors = ['#d8edff', '#7bb9ff', '#b6ddff', '#5085d4'];
          return (
            <line
              key={index}
              x1={x1.toFixed(2)}
              y1={y1.toFixed(2)}
              x2={x2.toFixed(2)}
              y2={y2.toFixed(2)}
              stroke={colors[index % colors.length]}
              strokeOpacity={index % 5 === 0 ? '.78' : '.36'}
              strokeWidth={index % 7 === 0 ? '1.7' : '.8'}
            />
          );
        })}
        <circle cx="320" cy="218" r="53" fill="#050b15" stroke="#b6ddff" strokeOpacity=".64" strokeWidth="3" />
        <circle cx="320" cy="218" r="46" fill="#02060d" />
        <path d="M245 136Q320 99 395 141" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="12" strokeLinecap="round" />
        <ellipse cx="283" cy="165" rx="25" ry="37" fill="#fff" fillOpacity=".83" transform="rotate(30 283 165)" />
        <ellipse cx="359" cy="260" rx="10" ry="16" fill="#b5e7ff" fillOpacity=".58" transform="rotate(30 359 260)" />
        <path d="M96 259q46-25 78-8m292-7q36-16 69 6M126 278q34-15 58-7m278-9q30-12 51 3" fill="none" stroke="#bb6476" strokeOpacity=".22" strokeWidth="2" />
      </g>
      <path d="M54 220Q320 22 586 220" fill="none" stroke="url(#bala-eye-lid)" strokeWidth="19" strokeLinecap="round" />
      <path d="M58 222Q320 32 582 222" fill="none" stroke="#eff7ff" strokeOpacity=".76" strokeWidth="5" strokeLinecap="round" />
      <path d="M54 220Q320 418 586 220" fill="none" stroke="#526e92" strokeWidth="15" strokeLinecap="round" />
      <path d="M66 224Q320 401 574 224" fill="none" stroke="#e0effd" strokeOpacity=".68" strokeWidth="4" strokeLinecap="round" />
      <path d="M89 193q21-48 43-70m4 61q17-44 31-58m19 42q10-37 19-48m330 73q-21-48-43-70m-4 61q-17-44-31-58m-19 42q-10-37-19-48" fill="none" stroke="#b8c9df" strokeOpacity=".88" strokeWidth="3" strokeLinecap="round" />
      <path d="M111 260q34 34 77 48m264-1q41-16 77-47" fill="none" stroke="#8296ad" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round" />
      <g className="eye-blink-lid" aria-hidden="true">
        <path d="M54 220Q320 22 586 220Q320 418 54 220Z" fill="url(#bala-eye-lid)" stroke="#091323" strokeWidth="8" />
        <path d="M58 220Q320 210 582 220" fill="none" stroke="#eff7ff" strokeOpacity=".72" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { t, language, locale, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const speech = useOfflineSpeech();
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [languageError, setLanguageError] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const [introVisible, setIntroVisible] = useState(canShowIntro);
  const voiceModeRef = useRef('activate');
  const handledTranscriptRef = useRef('');

  useEffect(() => {
    if (!introVisible) return undefined;
    const timeout = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
      } catch {
        // The intro still finishes when storage is unavailable.
      }
      setIntroVisible(false);
    }, 6600);
    return () => window.clearTimeout(timeout);
  }, [introVisible]);

  useEffect(() => {
    if (!speech.transcript) {
      handledTranscriptRef.current = '';
      return;
    }
    if (handledTranscriptRef.current === speech.transcript) return;
    handledTranscriptRef.current = speech.transcript;
    const transcript = normalizeVoiceCommand(speech.transcript).toLowerCase();
    if (voiceModeRef.current === 'activate') {
      const intent = findVoiceIntent(transcript);
      const path = VOICE_INTENT_PATHS[intent];
      if (intent === 'HELP') {
        const help = 'You can ask me to open any BALA feature, describe your surroundings, read a document, find a volunteer, report a hazard, get directions to a destination, ask about an animal or resource, or open your trusted contacts.';
        setVoiceFeedback(help);
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(help.replace(/\bBALA\b/gi, 'Bah-lah'));
          utterance.lang = locale;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      } else if (path) {
        if (user) navigate(path, { state: { voiceIntent: intent, voicePhrase: transcript } });
        else navigate('/login', { state: { returnTo: path, voiceIntent: intent, voicePhrase: transcript } });
      } else if (/^(?:hey\s+)?(?:bala|బాలా|బాల|बाला)[.!?,\s]*$/i.test(transcript)) {
        navigate(user ? '/app' : '/login');
      } else {
        setVoiceFeedback(`I heard “${transcript}”, but could not match it to a BALA page. Try “open the document reader”, “show the hazard map”, or “go to settings”.`);
      }
    } else if (transcript.includes('login') || transcript.includes('log in')) window.location.assign('/login');
    else if (transcript.includes('register') || transcript.includes('account')) window.location.assign('/register');
    else if (transcript.includes('bala') || transcript.includes('బాలా') || transcript.includes('बाला')) window.location.assign(user ? '/app' : '/login');
    else setVoiceFeedback('I did not understand. Say “BALA”, “login”, or “register”, or use the buttons instead.');
  }, [language, navigate, speech.transcript, user]);

  const changeLanguage = async (nextLanguage) => {
    setLanguageError('');
    try {
      await setLanguage(nextLanguage);
    } catch {
      setLanguageError('Your language changed on this device but could not be saved to your account.');
    }
  };

  const startVoice = (mode) => {
    voiceModeRef.current = mode;
    setVoiceFeedback('');
    speech.start();
  };

  const finishIntro = () => {
    try {
      window.sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
    } catch {
      // The intro still finishes when storage is unavailable.
    }
    setIntroVisible(false);
  };

  if (introVisible) {
    return (
      <main className="home-intro" aria-label="BALA welcome animation">
        <div className="home-intro-stars" aria-hidden="true" />
        <div className="home-intro-nebula" aria-hidden="true" />
        <svg className="home-intro-lightning" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path className="lightning-bolt lightning-bolt-one" d="M195 88l42 115-24 18 70 133-12-114 32-18-74-134 4 83z" />
          <path className="lightning-bolt lightning-bolt-two" d="M1015 143l-55 102 24 21-88 112 30-105-27-20 92-122-13 78z" />
          <path className="lightning-arc" d="M250 150q88 47 137 129t111 76m452-145q-89 45-132 121t-106 92" />
        </svg>
        <div className="home-intro-glow" aria-hidden="true" />
        <span className="home-intro-brand"><Eye size={19} aria-hidden="true" /> BALA</span>
        <div className="home-intro-art"><EyeArtwork className="intro-eye-artwork" /></div>
        <p className="home-intro-caption">A new way to see your world.</p>
        <button className="home-intro-skip" type="button" onClick={finishIntro}>Skip intro</button>
        <span className="sr-only" role="status" aria-live="polite">BALA welcome animation. The home page will appear shortly.</span>
      </main>
    );
  }

  return (
    <div className="marketing-page">
      <a className="skip-link" href="#home-main">Skip to main content</a>
      <header className="marketing-header">
        <Brand />
        <nav aria-label="Main navigation" className="marketing-nav">
          <a href="#features">What BALA can do</a><a href="#how-it-works">How it works</a><a href="#people">People who help</a>
        </nav>
        <div className="marketing-actions">
          <div className="language-control">
            <Languages size={16} aria-hidden="true" />
            <label htmlFor="home-language">Language</label>
          <select id="home-language" className="language-select" value={language} onChange={(event) => changeLanguage(event.target.value)}>
            {LANGUAGES.map(({ code, label, native }) => <option value={code} key={code}>{label} · {native}</option>)}
          </select>
          </div>
          {languageError && <span className="language-error" role="alert">{languageError}</span>}
          <button type="button" className="icon-button home-accessibility" onClick={() => setAccessibilityOpen(!accessibilityOpen)} aria-expanded={accessibilityOpen} aria-label="Accessibility options"><Ear size={18} /></button>
          {user ? <Link to="/app" className="button button-dark button-small">Open <ArrowRight size={15} /></Link> : <><Link to="/login" className="button button-quiet">Sign in</Link><Link to="/register" className="button button-dark button-small">Get started <ArrowRight size={15} /></Link></>}
        </div>
      </header>
      {accessibilityOpen && <div className="home-accessibility-popover" role="region" aria-label="Accessibility information"><strong>Designed around you</strong><p>Keyboard friendly, screen-reader aware, and ready to speak. Personal accessibility settings are available after signing in.</p><Link to="/login">Explore accessibility settings <ArrowRight size={14} /></Link></div>}

      <main id="home-main">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="overline"><span className="overline-line" />A COMPANION FOR EVERYDAY MOMENTS</div>
            <h1>{t('title')}</h1>
            <p className="hero-description">{t('subtitle')}</p>
            <div className="hero-cta">
              <Link to={user ? '/app' : '/register'} className="button button-lime">{user ? 'Open your space' : 'Get started for free'} <ArrowRight size={17} /></Link>
              <button type="button" className="button button-outline" aria-pressed={speech.state === 'RECORDING' && voiceModeRef.current === 'login'} disabled={speech.state === 'REQUESTING' || speech.state === 'TRANSCRIBING'} onClick={() => speech.state === 'RECORDING' ? speech.stop() : startVoice('login')}><Mic size={17} />{speech.state === 'RECORDING' && voiceModeRef.current === 'login' ? 'Stop listening' : 'Login with voice'}</button>
              <button type="button" className="button button-quiet" aria-pressed={speech.state === 'RECORDING' && voiceModeRef.current === 'activate'} disabled={speech.state === 'REQUESTING' || speech.state === 'TRANSCRIBING'} onClick={() => speech.state === 'RECORDING' ? speech.stop() : startVoice('activate')}><AudioLines size={17} />{speech.state === 'RECORDING' && voiceModeRef.current === 'activate' ? 'Stop listening' : 'Activate BALA'}</button>
            </div>
            <p className="voice-command-hint">Press Activate BALA, say what you need, then stop listening. Try “navigate to the library” or “what is a dog?”.</p>
            {speech.state === 'RECORDING' && <div className="voice-live-status" role="status" aria-live="assertive">
              <span className="voice-live-dot" aria-hidden="true" />
              <span><strong>LISTENING NOW</strong><small>{speech.inputLevel > 0.025 ? 'Microphone is picking up sound.' : 'Speak clearly into your microphone.'} Press Stop listening when done. Audio stays on this device.</small></span>
              <span className="voice-level-meter" aria-hidden="true">{[0.04, 0.1, 0.2, 0.1, 0.04].map((threshold, index) => <i className={speech.inputLevel >= threshold ? 'voice-level-active' : ''} key={index} />)}</span>
              <span className="voice-recording-timer" aria-live="off">{15 - speech.recordingSeconds}s</span>
            </div>}
            {speech.state === 'REQUESTING' && <p className="voice-activation-message" role="status" aria-live="polite">Connecting to your microphone…</p>}
            {(speech.state === 'TRANSCRIBING' || speech.state === 'ERROR' || voiceFeedback) && <p className={`voice-activation-message${speech.state === 'ERROR' ? ' voice-activation-error' : ''}`} role="status" aria-live="polite">{voiceFeedback || speech.message}</p>}
            <div className="hero-trust"><ShieldCheck size={17} aria-hidden="true" /><span>Your voice stays yours. No raw voice recordings are stored.</span></div>
          </div>
          <div className="hero-art">
            <div className="hero-art-orbit hero-art-orbit-one" aria-hidden="true" />
            <div className="hero-art-orbit hero-art-orbit-two" aria-hidden="true" />
            <EyeArtwork className="hero-eye-artwork" />
            <div className={`hero-status-card${speech.state === 'RECORDING' ? ' hero-status-card-listening' : ''}`} role="status">
              <AudioLines size={17} aria-hidden="true" />
              <span><strong>{speech.state === 'RECORDING' ? 'Listening now' : speech.state === 'TRANSCRIBING' ? 'Transcribing on device' : 'Ready when you are'}</strong><small>{speech.state === 'RECORDING' ? `${15 - speech.recordingSeconds} seconds left · audio stays on this device` : 'Your companion, in your own words.'}</small></span>
            </div>
          </div>
          <a href="#features" className="scroll-cue"><span>SCROLL TO EXPLORE</span><ArrowDown size={15} /></a>
        </section>

        <section id="features" className="features-section">
          <div className="section-heading"><div><div className="overline"><span className="overline-line" />THOUGHTFUL TOOLS, ONE PLACE</div><h2>A more accessible<br />kind of everyday.</h2></div><p>Practical features for moving through your day with more confidence and a little less friction.</p></div>
          <div className="feature-grid">{features.map(({ icon: Icon, title, description }, index) => <article className={`feature-card feature-card-${index + 1}`} key={title}><div className="feature-icon"><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></div><span className="feature-index">0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
          <div className="feature-footnote"><Sparkles size={16} aria-hidden="true" /><span>More tools, one helpful voice. Your settings go with you.</span><Link to={user ? '/app/settings' : '/register'}>Explore BALA <ArrowRight size={14} /></Link></div>
        </section>

        <section id="how-it-works" className="how-section">
          <div className="how-intro"><div className="overline"><span className="overline-line" />SIMPLE BY DESIGN</div><h2>Just say the word.<br /><span>BALA.</span></h2><p>No maze of menus. Start with your voice, or use the clear, easy-to-find controls. You choose what works.</p><Link className="text-link" to={user ? '/app' : '/register'}>See how it feels <ArrowRight size={15} /></Link></div>
          <div className="how-steps"><article><span className="step-number">01</span><div><Mic size={19} /><h3>Say “BALA”</h3>          <p>Press the microphone, speak, then stop to transcribe. Your audio stays on this device.</p></div></article><article><span className="step-number">02</span><div><Languages size={19} /><h3>Your language, your pace</h3><p>Speak and listen in English, తెలుగు, हिन्दी or Español. Change settings any time.</p></div></article><article><span className="step-number">03</span><div><Heart size={19} /><h3>You're always in control</h3><p>Pause, turn off location, or choose not to save a document. Nothing happens without your say-so.</p></div></article></div>
        </section>

        <section id="people" className="people-section"><div className="people-shape"><UsersRound size={36} strokeWidth={1.4} /></div><div><div className="overline"><span className="overline-line" />HELP, FROM A HUMAN</div><h2>Technology helps.<br /><span>People make it personal.</span></h2><p>Connect with a verified volunteer for a private video call when a human perspective feels right.</p></div><Link to={user ? '/app/volunteers' : '/register'} className="button button-light">Meet a volunteer <ArrowRight size={16} /></Link></section>

        <section className="safety-note"><span className="safety-icon"><ShieldCheck size={20} /></span><div><strong>A helpful companion, not a safety guarantee.</strong><p>AI descriptions, hazard alerts and location features can be wrong or incomplete. Keep using your usual mobility aids and follow professional guidance. BALA does not contact emergency services.</p></div></section>
      </main>

      <footer className="marketing-footer"><Brand compact /><p>A little more independence, every day.</p><div><Link to="/login">Sign in</Link><Link to="/register">Create an account</Link><a href="#features">Features</a></div><span>© {new Date().getFullYear()} BALA · Made for everyone.</span></footer>
    </div>
  );
}
