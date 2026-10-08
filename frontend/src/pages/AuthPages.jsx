import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AudioLines, Eye, EyeOff, LockKeyhole, Mail, Mic, ShieldCheck } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { LANGUAGES } from '../constants/languages.js';
import api, { apiMessage } from '../services/api.js';
import { useOfflineSpeech } from '../hooks/useOfflineSpeech.js';

function AuthFrame({ title, subtitle, children, aside }) {
  return (
    <div className="auth-page">
      <Link className="skip-link" to="#auth-main">Skip to form</Link>
      <header className="auth-header"><Brand /><Link to="/" className="back-link"><ArrowLeft size={15} />Back to BALA</Link></header>
      <main id="auth-main" className="auth-main"><section className="auth-card"><div className="overline"><span className="overline-line" />A SPACE THAT'S YOURS</div><h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>{children}</section>
        <aside className="auth-aside"><div className="auth-aside-mark"><ShieldCheck size={24} /></div><span className="eyebrow">BUILT AROUND YOUR CHOICES</span><h2>Accessible, without the fuss.</h2><p>Large, clear controls. Keyboard-friendly forms. Helpful voice features, never voice-only security.</p><div className="aside-mini"><span><AudioLines size={15} />Voice is optional</span><span><LockKeyhole size={15} />Passwords stay private</span></div>{aside}</aside>
      </main>
      <footer className="auth-footer"><span>© {new Date().getFullYear()} BALA · A little more independence, every day.</span><Link to="/register">Need an account?</Link></footer>
    </div>
  );
}

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useLanguage();
  const speech = useOfflineSpeech();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [voiceMessage, setVoiceMessage] = useState('');

  useEffect(() => {
    if (!speech.transcript) return;
    const transcript = speech.transcript;
    const spokenEmail = transcript.match(/email is\s+(.+?)(?:\s+password is|$)/i)?.[1];
    const spokenPassword = transcript.match(/password is\s+(.+)$/i)?.[1];
    if (spokenEmail) setEmail(spokenEmail.replace(/\s+at\s+/i, '@').replace(/\s+dot\s+/gi, '.').replace(/\s/g, '').toLowerCase());
    if (spokenPassword) setPassword(spokenPassword.trim());
    setVoiceMessage(spokenEmail || spokenPassword
      ? 'Voice filled the fields. Review them and press Sign in. Speech was transcribed on this device.'
      : 'I could not recognize an email or password. Please type your credentials instead.');
  }, [speech.transcript]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn({ email, password });
      setPassword('');
      const returnTo = location.state?.returnTo;
      navigate(typeof returnTo === 'string' && (returnTo === '/app' || returnTo.startsWith('/app/')) ? returnTo : '/app', {
        replace: true,
        state: { voiceIntent: location.state?.voiceIntent, voicePhrase: location.state?.voicePhrase },
      });
    } catch (problem) {
      setError(apiMessage(problem));
    } finally {
      setBusy(false);
    }
  };

  const voiceLogin = () => {
    setVoiceMessage('');
    speech.start();
  };

  return <AuthFrame title="Welcome back." subtitle="Sign in to your BALA space and get the help that works for you.">
    <form className="auth-form" onSubmit={submit}>
      <div className="field-label-row"><label htmlFor="email">Email address</label><span>REQUIRED</span></div>
      <div className="input-with-icon"><Mail size={17} aria-hidden="true" /><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
      <div className="field-label-row"><label htmlFor="password">Password</label><Link to="/forgot-password">Forgot password?</Link></div>
      <div className="input-with-icon"><LockKeyhole size={17} aria-hidden="true" /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      <button className="button button-dark full-button auth-submit" disabled={busy}>{busy ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}</button>
    </form>
    <div className="auth-divider"><span />OR<span /></div>
    <button type="button" className="button button-outline full-button" disabled={speech.state === 'REQUESTING' || speech.state === 'TRANSCRIBING'} onClick={() => speech.state === 'RECORDING' ? speech.stop() : voiceLogin()}><Mic size={16} />{speech.state === 'RECORDING' ? 'Stop and transcribe' : 'Help me sign in with voice'}</button>
    {(speech.message || voiceMessage) && <p className="voice-login-message" role="status">{voiceMessage || speech.message}</p>}
    <p className="auth-bottom">New to BALA? <Link to="/register">Create an account</Link></p>
  </AuthFrame>;
}

export function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER', language: 'en' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(form, '/auth/register');
      navigate('/app');
    } catch (problem) {
      setError(apiMessage(problem));
    } finally {
      setBusy(false);
    }
  };

  const change = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  return <AuthFrame title="Make BALA yours." subtitle="A few details to get your accessible companion ready.">
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="name">Your name</label><input id="name" name="name" autoComplete="name" required minLength={2} maxLength={80} value={form.name} onChange={change} placeholder="How should we call you?" />
      <label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={change} placeholder="you@example.com" />
      <label htmlFor="password">Create a password <span className="field-hint">10 characters or more</span></label><input id="password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={form.password} onChange={change} />
      <label htmlFor="role">I am joining as</label><select id="role" name="role" value={form.role} onChange={change}><option value="USER">User</option><option value="VOLUNTEER">Volunteer</option></select>
      <label htmlFor="language">Preferred language</label><select id="language" name="language" value={form.language} onChange={change}>{LANGUAGES.map(({ code, label, native }) => <option value={code} key={code}>{label} · {native}</option>)}</select>
      {error && <div className="inline-error" role="alert">{error}</div>}
      <button className="button button-dark full-button auth-submit" disabled={busy}>{busy ? 'Creating your account…' : <>Create account <ArrowRight size={16} /></>}</button>
    </form>
    <p className="auth-bottom">Already have an account? <Link to="/login">Sign in</Link></p>
  </AuthFrame>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (problem) {
      setError(apiMessage(problem));
    } finally {
      setBusy(false);
    }
  };
  return <AuthFrame title="Let's get you back in." subtitle="We'll send a one-time password reset link to your email."><form className="auth-form" onSubmit={submit}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />{error && <div role="alert" className="inline-error">{error}</div>}{message && <div role="status" className="success-note">{message}</div>}<button className="button button-dark full-button" disabled={busy}>{busy ? 'Sending…' : <>Send recovery link <ArrowRight size={16} /></>}</button></form><p className="auth-bottom"><Link to="/login">Return to sign in</Link></p></AuthFrame>;
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token: params.get('token'), password });
      setPassword('');
      navigate('/login', { replace: true });
    } catch (problem) {
      setError(apiMessage(problem));
    } finally {
      setBusy(false);
    }
  };
  return <AuthFrame title="Choose a new password." subtitle="Reset links expire after 15 minutes."><form className="auth-form" onSubmit={submit}><label htmlFor="password">New password</label><input id="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />{error && <div role="alert" className="inline-error">{error}</div>}<button className="button button-dark full-button" disabled={busy}>{busy ? 'Updating…' : 'Save new password'}</button></form><p className="auth-bottom"><Link to="/login">Return to sign in</Link></p></AuthFrame>;
}
