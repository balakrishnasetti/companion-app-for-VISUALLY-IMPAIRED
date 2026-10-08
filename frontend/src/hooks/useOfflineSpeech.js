import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeOfflineAudio } from '../services/offlineSpeech.js';
import audioCaptureProcessorUrl from '../workers/audioCaptureProcessor.js?url&no-inline';
import { validateVoiceTranscript } from '../services/voiceTranscript.js';
import { normalizeVoiceCommand } from '../services/voiceCommands.js';

const SAMPLE_RATE = 16_000;
const MAX_RECORDING_MS = 15_000;
const MIN_RECORDING_MS = 500;
const SPEECH_LEVEL_THRESHOLD = 0.045;
const END_OF_SPEECH_MS = 1800;

function resampleTo16k(samples, sampleRate) {
  if (sampleRate === SAMPLE_RATE) return samples;

  const outputLength = Math.ceil((samples.length * SAMPLE_RATE) / sampleRate);
  const resampled = new Float32Array(outputLength);
  const ratio = sampleRate / SAMPLE_RATE;
  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const before = Math.floor(sourceIndex);
    const after = Math.min(before + 1, samples.length - 1);
    const fraction = sourceIndex - before;
    resampled[index] = samples[before] * (1 - fraction) + samples[after] * fraction;
  }
  return resampled;
}

export function useOfflineSpeech() {
  const captureRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [state, setState] = useState('IDLE');
  const [message, setMessage] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [inputLevel, setInputLevel] = useState(0);
  const voiceActivityRef = useRef({ heardSpeech: false, lastSpeechAt: 0 });

  const stop = useCallback(() => {
    window.clearTimeout(timerRef.current);
    const capture = captureRef.current;
    if (!capture) return;
    if (capture.stopping) return;
    capture.stopping = true;
    window.clearInterval(capture.elapsedTimer);
    void (async () => {
      await new Promise((resolve) => {
        capture.flushResolve = resolve;
        capture.processor.port.postMessage({ type: 'flush' });
      });
      captureRef.current = null;
      setInputLevel(0);
      if (Date.now() - capture.startedAt < MIN_RECORDING_MS) {
        capture.stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setMessage('Please speak for at least half a second before stopping.');
        setState('IDLE');
        void capture.context.close();
        return;
      }
      if (!capture.processor || !capture.chunks) {
        capture.stream?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setMessage('Voice capture was interrupted by an app update. Please start recording again.');
        setState('ERROR');
        return;
      }
      capture.processor.port.onmessage = null;
      capture.source.disconnect();
      capture.processor.disconnect();
      capture.silence.disconnect();
      capture.stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      const length = capture.chunks.reduce((total, chunk) => total + chunk.length, 0);
      if (!length) {
        setMessage('No audio was captured. Check that your microphone is connected, then try again.');
        setState('ERROR');
        void capture.context.close();
        return;
      }
      const samples = new Float32Array(length);
      let offset = 0;
      for (const chunk of capture.chunks) {
        samples.set(chunk, offset);
        offset += chunk.length;
      }
      void capture.context.close();
      setState('TRANSCRIBING');
      setMessage('Preparing your audio on this device…');
      const audio = resampleTo16k(samples, capture.sampleRate);
      void transcribeOfflineAudio(audio, setMessage).then((text) => {
        const recognizedText = normalizeVoiceCommand(validateVoiceTranscript(text));
        if (!recognizedText) {
          setTranscript('');
          setMessage('I could not recognize a clear command. Please speak in your selected language and try again.');
          setState('IDLE');
        } else {
          setTranscript(recognizedText);
          setMessage(`I heard: “${recognizedText}”`);
          setState('IDLE');
        }
      }).catch((error) => {
        const detail = error.message || '';
        setMessage(!navigator.onLine || /fetch|network|download/i.test(detail)
          ? 'The offline speech model could not be downloaded. Connect to the internet and try again; once downloaded, speech runs on this device. Your audio was not uploaded.'
          : `Offline speech recognition could not finish: ${detail}`);
        setState('ERROR');
      });
    })();
  }, []);

  useEffect(() => {
    if (state !== 'RECORDING') {
      voiceActivityRef.current = { heardSpeech: false, lastSpeechAt: 0 };
      return undefined;
    }

    const now = Date.now();
    if (inputLevel >= SPEECH_LEVEL_THRESHOLD) {
      voiceActivityRef.current = { heardSpeech: true, lastSpeechAt: now };
      return undefined;
    }

    if (!voiceActivityRef.current.heardSpeech) return undefined;
    const silenceRemaining = END_OF_SPEECH_MS - (now - voiceActivityRef.current.lastSpeechAt);
    if (silenceRemaining <= 0) {
      stop();
      return undefined;
    }
    const timer = window.setTimeout(stop, silenceRemaining);
    return () => window.clearTimeout(timer);
  }, [inputLevel, state, stop]);

  const start = useCallback(async () => {
    if (state === 'RECORDING') {
      stop();
      return;
    }
    if (state === 'REQUESTING' || state === 'TRANSCRIBING') return;
    setState('REQUESTING');
    setTranscript('');
    setMessage('');
    setInputLevel(0);

    let stream;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('This browser does not support microphone recording.');
      }
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          channelCount: { ideal: 1 },
        },
      });
    } catch (error) {
      const message = error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError'
        ? 'No microphone was found. Connect or enable one, then try again.'
        : error.name === 'NotAllowedError' || error.name === 'SecurityError'
          ? 'Microphone access is blocked. Allow microphone access in your browser settings, then reload this page.'
          : error.message || 'The microphone could not be accessed. Check your browser and device settings.';
      setMessage(message);
      setState('ERROR');
      return;
    }

    streamRef.current = stream;
    let context;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass || !window.AudioWorkletNode) throw new Error('On-device microphone recording is not supported in this browser.');
      context = new AudioContextClass();
      await context.resume();
      await context.audioWorklet.addModule(audioCaptureProcessorUrl);
      const source = context.createMediaStreamSource(stream);
      const inputChannels = Math.min(stream.getAudioTracks()[0].getSettings().channelCount || 1, 2);
      const processor = new AudioWorkletNode(context, 'bala-audio-capture', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: inputChannels,
        outputChannelCount: [1],
      });
      const silence = context.createGain();
      silence.gain.value = 0;
      const chunks = [];
      const capture = { stream, context, source, processor, silence, chunks, sampleRate: context.sampleRate, flushResolve: null };
      processor.port.onmessage = ({ data }) => {
        if (data.type === 'audio') chunks.push(new Float32Array(data.samples));
        if (data.type === 'audio') setInputLevel(data.level);
        if (data.type === 'flushed') capture.flushResolve?.();
      };
      source.connect(processor);
      processor.connect(silence);
      silence.connect(context.destination);
      captureRef.current = capture;
      streamRef.current = stream;
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      await context?.close();
      streamRef.current = null;
      setMessage('The microphone recorder could not start. Try an up-to-date browser or use the buttons instead.');
      setState('ERROR');
      return;
    }
    try {
      setState('RECORDING');
      setRecordingSeconds(0);
      setMessage('Listening now. Speak your command naturally; transcription starts after a short pause, or press Stop listening to finish sooner.');
      const capture = captureRef.current;
      capture.startedAt = Date.now();
      capture.elapsedTimer = window.setInterval(() => {
        setRecordingSeconds(Math.min(MAX_RECORDING_MS / 1000, Math.floor((Date.now() - capture.startedAt) / 1000)));
      }, 250);
      timerRef.current = window.setTimeout(stop, MAX_RECORDING_MS);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      await context?.close();
      captureRef.current = null;
      streamRef.current = null;
      setMessage('Audio recording could not start. Please try again.');
      setState('ERROR');
    }
  }, [state, stop]);

  useEffect(() => () => {
    window.clearTimeout(timerRef.current);
    const capture = captureRef.current;
    if (capture) {
      window.clearInterval(capture.elapsedTimer);
      capture.processor?.port?.postMessage({ type: 'flush' });
      if (capture.processor?.port) capture.processor.port.onmessage = null;
      capture.source?.disconnect();
      capture.processor?.disconnect();
      capture.silence?.disconnect();
      capture.stream.getTracks().forEach((track) => track.stop());
      void capture.context.close();
    } else {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    }
  }, []);

  return { state, message, transcript, recordingSeconds, inputLevel, start, stop };
}
