import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, CameraOff, Check, Clock3, Mic, MicOff, PhoneOff, Star, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../hooks/useSocket.js';
import { useWebRTC } from '../hooks/useWebRTC.js';
import StatusPill from '../components/StatusPill.jsx';
import api, { apiMessage } from '../services/api.js';
import { enqueue } from '../services/offlineQueue.js';

function formatDuration(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function CallRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const { localStream, remoteStream, status, error: mediaError, muted, cameraOff, toggleMute, toggleCamera, closeMedia } = useWebRTC(id, socket);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [call, setCall] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [ended, setEnded] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/calls/${id}`).then((response) => {
      setCall(response.data.data.call);
      if (response.data.data.call.startedAt) setElapsed(Math.floor((Date.now() - new Date(response.data.data.call.startedAt).getTime()) / 1000));
    }).catch((problem) => setError(apiMessage(problem)));
  }, [id]);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);
  useEffect(() => {
    if (ended || !call?.startedAt) return undefined;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [ended, call?.startedAt]);
  useEffect(() => {
    if (!socket) return undefined;
    const onConnected = (event) => {
      if (event.callId === id) setCall((previous) => ({ ...previous, startedAt: new Date().toISOString() }));
    };
    const onEnded = (event) => {
      if (event.callId === id) {
        setEnded(true);
        closeMedia();
      }
    };
    socket.on('call:connected', onConnected);
    socket.on('call:ended', onEnded);
    return () => {
      socket.off('call:connected', onConnected);
      socket.off('call:ended', onEnded);
    };
  }, [socket, id, closeMedia]);

  const endCall = async () => {
    setError('');
    try {
      await api.post(`/calls/${id}/end`);
      setEnded(true);
      closeMedia();
    } catch (problem) {
      setError(apiMessage(problem));
    }
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    try {
      if (!navigator.onLine) {
        await enqueue('FEEDBACK', { callId: id, rating, comment: feedback }, user.id);
        setMessage('Your feedback is saved on this device and will sync when you are online.');
      } else {
        await api.post('/feedback', { callId: id, rating, comment: feedback });
        setMessage('Thank you. Your feedback has been saved.');
      }
    } catch (problem) {
      setError(apiMessage(problem));
    }
  };

  const peerName = user?.role === 'VOLUNTEER' ? call?.user?.name : call?.volunteer?.name;

  return (
    <div className="call-page">
      <button type="button" className="back-link" onClick={() => navigate('/app/volunteers')}><ArrowLeft size={15} />Back to assistance</button>
      <div className="call-heading"><div><div className="overline"><span className="overline-line" />PRIVATE VOLUNTEER CALL</div><h1>{ended ? 'Call complete' : peerName ? `You're connected with ${peerName}` : 'Connecting you…'}</h1><p>Camera and microphone access stay in your control.</p></div><StatusPill variant={status === 'Connected' ? 'success' : 'warning'}><span className="status-dot" />{ended ? 'Ended' : status}</StatusPill></div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      {mediaError && <div className="inline-error" role="alert">{mediaError}</div>}
      <div className="video-stage">
        <div className={`remote-video-box ${remoteStream ? '' : 'video-placeholder'}`}>
          {remoteStream ? <video ref={remoteVideoRef} autoPlay playsInline aria-label={`Video call with ${peerName || 'volunteer'}`} /> : <div className="video-placeholder-content"><span className="call-avatar">{peerName?.slice(0, 1) || <UsersRoundIcon />}</span><strong>{peerName || 'Waiting for the other person'}</strong><span>{status}</span></div>}
          <span className="video-label">{peerName || 'Volunteer'}</span>
        </div>
        <div className="local-video-box">{localStream && !cameraOff ? <video ref={localVideoRef} autoPlay playsInline muted aria-label="Your camera preview" /> : <div className="local-video-off"><CameraOff size={19} /><span>Camera off</span></div>}<span className="video-label">You</span></div>
        <div className="call-timer"><Clock3 size={14} />{formatDuration(elapsed)}</div>
      </div>
      {!ended && <div className="call-controls"><button type="button" className={`call-control ${muted ? 'call-control-active' : ''}`} onClick={toggleMute} aria-pressed={muted}><span>{muted ? <MicOff size={19} /> : <Mic size={19} />}</span>{muted ? 'Unmute' : 'Mute'}</button><button type="button" className={`call-control ${cameraOff ? 'call-control-active' : ''}`} onClick={toggleCamera} aria-pressed={cameraOff}><span>{cameraOff ? <CameraOff size={19} /> : <Video size={19} />}</span>{cameraOff ? 'Turn camera on' : 'Turn camera off'}</button><button type="button" className="call-control call-end-button" onClick={endCall}><span><PhoneOff size={19} /></span>End call</button></div>}
      {ended && user?.role === 'USER' && !message && <form className="tool-card feedback-card" onSubmit={submitFeedback}><h2>How was your conversation?</h2><label htmlFor="call-rating">Rate your volunteer</label><select id="call-rating" value={rating} onChange={(event) => setRating(Number(event.target.value))}><option value={5}>5 — Excellent</option><option value={4}>4 — Good</option><option value={3}>3 — Okay</option><option value={2}>2 — Not great</option><option value={1}>1 — Poor</option></select><label htmlFor="call-feedback">Anything you'd like to share? <span>(optional)</span></label><textarea id="call-feedback" rows={3} maxLength={1000} value={feedback} onChange={(event) => setFeedback(event.target.value)} /><button type="submit" className="button button-dark"><Star size={15} />Send feedback</button></form>}
      {message && <div className="success-note" role="status"><Check size={16} />{message}</div>}
      <p className="call-footnote">Only the two people in this call can exchange audio and video. Connection quality depends on your network; a TURN server may be needed on some networks.</p>
    </div>
  );
}

function UsersRoundIcon() {
  return <Camera size={23} />;
}
