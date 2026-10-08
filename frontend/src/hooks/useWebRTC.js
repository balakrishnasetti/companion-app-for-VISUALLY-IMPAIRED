import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export function useWebRTC(callId, socket) {
  const { user } = useAuth();
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [status, setStatus] = useState('Connecting to call…');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const closeMedia = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  useEffect(() => {
    if (!socket || !callId) return undefined;
    let disposed = false;
    let peer;

    const startCall = async () => {
      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
        setError('This browser does not support video calls. Please try a recent browser.');
        setStatus('Video calling unavailable');
        return;
      }
      try {
        const [callResponse, iceResponse] = await Promise.all([
          api.get(`/calls/${callId}`),
          api.get('/calls/ice-servers'),
        ]);
        if (disposed) return;
        const call = callResponse.data.data.call;
        const isCaller = user.id === (call.user.id || call.user._id);
        const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (disposed) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = media;
        setLocalStream(media);
        peer = new RTCPeerConnection({ iceServers: iceResponse.data.data.iceServers });
        peerRef.current = peer;
        media.getTracks().forEach((track) => peer.addTrack(track, media));
        peer.ontrack = (event) => setRemoteStream(event.streams[0]);
        peer.onicecandidate = (event) => {
          if (event.candidate) socket.emit('webrtc:ice-candidate', { callId, signal: event.candidate });
        };
        peer.onconnectionstatechange = () => {
          const states = {
            connected: 'Connected',
            connecting: 'Connecting…',
            disconnected: 'Connection interrupted. Trying to reconnect…',
            failed: 'Connection failed. Check your network and try again.',
            closed: 'Call ended',
          };
          setStatus(states[peer.connectionState] || 'Connecting…');
        };
        if (isCaller) {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit('webrtc:offer', { callId, signal: offer });
          setStatus('Calling volunteer…');
        } else {
          setStatus('Waiting for the call connection…');
        }
      } catch (problem) {
        if (disposed) return;
        if (problem.name === 'NotAllowedError' || problem.name === 'PermissionDeniedError') {
          setError('Camera or microphone access was denied. Enable access in your browser settings and rejoin.');
        } else {
          setError(problem.response?.data?.message || 'The call could not be started. Check your camera and network.');
        }
        setStatus('Unable to connect');
      }
    };

    const onSignal = async (event) => {
      if (event.callId !== callId || !peerRef.current) return;
      const currentPeer = peerRef.current;
      try {
        if (event.type === 'offer') {
          await currentPeer.setRemoteDescription(new RTCSessionDescription(event.signal));
          const answer = await currentPeer.createAnswer();
          await currentPeer.setLocalDescription(answer);
          socket.emit('webrtc:answer', { callId, signal: answer });
          setStatus('Connecting…');
          for (const candidate of pendingCandidates.current.splice(0)) await currentPeer.addIceCandidate(candidate);
        } else if (event.type === 'answer') {
          await currentPeer.setRemoteDescription(new RTCSessionDescription(event.signal));
          for (const candidate of pendingCandidates.current.splice(0)) await currentPeer.addIceCandidate(candidate);
        } else if (event.type === 'ice-candidate') {
          const candidate = new RTCIceCandidate(event.signal);
          if (currentPeer.remoteDescription) await currentPeer.addIceCandidate(candidate);
          else pendingCandidates.current.push(candidate);
        }
      } catch {
        setError('A video connection message could not be processed. Please leave and rejoin the call.');
      }
    };

    startCall();
    socket.on('webrtc:signal', onSignal);
    return () => {
      disposed = true;
      socket.off('webrtc:signal', onSignal);
      closeMedia();
      pendingCandidates.current = [];
    };
  }, [callId, socket, closeMedia, user?.id]);

  const toggleMute = () => {
    const next = !muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next; });
    setMuted(next);
  };

  const toggleCamera = () => {
    const next = !cameraOff;
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !next; });
    setCameraOff(next);
  };

  return { localStream, remoteStream, status, error, muted, cameraOff, toggleMute, toggleCamera, closeMedia };
}
