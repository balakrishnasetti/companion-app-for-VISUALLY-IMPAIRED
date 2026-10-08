import { Link } from 'react-router-dom';
import {
  ArrowRight, AudioLines, BookOpen, Compass, FileText, Heart, MapPinned, Mic, ShieldAlert,
  UsersRound, WalletCards, Eye, Accessibility, MoveUpRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useVoiceAssistant } from '../context/VoiceAssistantContext.jsx';
import StatusPill from '../components/StatusPill.jsx';

const actions = [
  { to: '/app/scene', title: 'scene', detail: 'sceneDetail', icon: Eye, color: 'sage' },
  { to: '/app/obstacles', title: 'obstacles', detail: 'obstacleDetail', icon: Accessibility, color: 'lilac' },
  { to: '/app/document', title: 'document', detail: 'documentDetail', icon: FileText, color: 'peach' },
  { to: '/app/currency', title: 'currency', detail: 'currencyDetail', icon: WalletCards, color: 'blue' },
  { to: '/app/volunteers', title: 'volunteers', detail: 'volunteerDetail', icon: UsersRound, color: 'yellow' },
  { to: '/app/map', title: 'map', detail: 'mapDetail', icon: MapPinned, color: 'mint' },
  { to: '/app/hazards', title: 'reportHazard', detail: 'reportDetail', icon: ShieldAlert, color: 'rose' },
  { to: '/app/navigation', title: 'navigation', detail: 'navigationDetail', icon: Compass, color: 'rose' },
  { to: '/app/learn', title: 'knowledge', detail: 'knowledgeDetail', icon: BookOpen, color: 'sage' },
  { to: '/app/sos', title: 'sos', detail: 'sosDetail', icon: Heart, color: 'pink' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const voice = useVoiceAssistant();

  const handleVoice = () => {
    if (voice.state === 'LISTENING_FOR_BALA' || voice.state === 'SPEAKING') voice.stop();
    else voice.start();
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading"><div><div className="overline"><span className="overline-line" />YOUR DAY, YOUR WAY</div><h1>{t('greeting')}, {user?.name?.split(' ')[0]}<span className="heading-period">.</span></h1><p>{t('quickActions')}</p></div><StatusPill variant="success"><span className="status-dot" />Your space is ready</StatusPill></div>

      <section className={`voice-banner ${voice.state === 'LISTENING_FOR_BALA' ? 'voice-banner-active' : ''}`} aria-label="BALA voice assistant">
        <div className="voice-banner-copy"><div className="voice-label"><span className={`voice-pulse${voice.state === 'LISTENING_FOR_BALA' ? ' voice-pulse-active' : ''}`} />{voice.state === 'LISTENING_FOR_BALA' ? 'LISTENING NOW · SPEAK CLEARLY' : voice.state === 'SPEAKING' ? 'BALA IS RESPONDING' : 'YOUR VOICE-FIRST COMPANION'}</div><h2>Go on. <span>Say it your way.</span></h2><p aria-live="polite">{voice.state === 'LISTENING_FOR_BALA' ? `Recording on this device · ${15 - voice.recordingSeconds}s left · I will transcribe after you pause` : voice.state === 'PROCESSING' ? 'Transcribing on this device…' : 'Say “describe my surroundings”, “what is a dog?”, or “navigate to the library”.'}</p>
          {voice.state === 'LISTENING_FOR_BALA' && <div className="dashboard-listening-status" role="status" aria-live="polite"><span className="dashboard-level-meter" aria-hidden="true">{[0.04, 0.1, 0.2, 0.1, 0.04].map((threshold, index) => <i className={voice.inputLevel >= threshold ? 'voice-level-active' : ''} key={index} />)}</span><span>{voice.inputLevel > 0.025 ? 'Microphone is picking up your voice' : 'Listening — speak clearly toward your microphone'}</span></div>}
          {voice.transcript && <p className="voice-recognized-text">Recognized: “{voice.transcript}”</p>}
          <div className="voice-feedback" role="status" aria-live="polite">{voice.message}{voice.wakeDetected && <span className="wake-indicator">BALA heard you</span>}</div>
          {!voice.supported && <p className="inline-warning">Voice recognition is not supported in this browser. Use the buttons below instead.</p>}
        </div>
        <button type="button" className={`bala-mic-button ${voice.state === 'LISTENING_FOR_BALA' ? 'bala-mic-listening' : ''}`} disabled={voice.state === 'PROCESSING'} onClick={handleVoice} aria-label={voice.state === 'LISTENING_FOR_BALA' ? 'Finish listening now' : voice.state === 'SPEAKING' ? 'Stop BALA speaking' : 'Start offline voice recording'} aria-pressed={voice.state === 'LISTENING_FOR_BALA'}>
          {voice.state === 'LISTENING_FOR_BALA' ? <AudioLines size={28} /> : <Mic size={28} />}
          <span className="mic-button-caption">{voice.state === 'LISTENING_FOR_BALA' ? t('stop') : t('listen')}</span>
        </button>
        <div className="voice-decoration" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
      </section>

      <div className="section-subheading"><div><h2>{t('chooseHelp')}</h2><p>Every tool works with voice and touch.</p></div><Link to="/app/settings" className="text-link">Make it yours <ArrowRight size={15} /></Link></div>
      <section className="action-grid" aria-label="Accessibility tools">
        {actions.map(({ to, title, detail, icon: Icon, color }, index) => <Link to={to} key={to} className="action-card">
          <span className={`action-icon action-${color}`}><Icon size={20} strokeWidth={1.8} aria-hidden="true" /></span>
          <span className="action-index">0{index + 1}</span>
          <h3>{t(title)}</h3><p>{t(detail)}</p><span className="action-arrow" aria-hidden="true"><MoveUpRight size={16} /></span>
        </Link>)}
      </section>

      <section className="dashboard-reminder"><div className="reminder-icon"><ShieldAlert size={19} /></div><div><strong>A helpful reminder</strong><p>Camera descriptions and hazard alerts can be mistaken. Keep your mobility aids close and trust what you know.</p></div><Link to="/app/sos" aria-label="Open emergency assistance"><ArrowRight size={18} /></Link></section>
    </div>
  );
}
