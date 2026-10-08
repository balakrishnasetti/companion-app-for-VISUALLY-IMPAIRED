import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useOfflineSpeech } from './useOfflineSpeech.js';
import api from '../services/api.js';
import { findVoiceIntent, isVolunteerConnectionRequest, normalizeVoiceCommand, VOICE_INTENT_PATHS } from '../services/voiceCommands.js';
import { activateConfirmedVoiceControl, executeVoiceUiCommand, parseVoiceUiCommand } from '../services/voiceUiCommands.js';

const INTENT_LABELS = {
  SCENE_DESCRIPTION: 'the scene description tool',
  OBSTACLE_DETECTION: 'the obstacle detection tool',
  DOCUMENT_READER: 'the document reader',
  BILL_READER: 'the currency reader',
  VOLUNTEER_REQUEST: 'available volunteers',
  REPORT_HAZARD: 'hazard reporting',
  CURRENT_LOCATION: 'your location',
  START_NAVIGATION: 'navigation alerts',
  NAVIGATION: 'navigation alerts',
  STOP_NAVIGATION: 'navigation alerts',
  HAZARD_MAP: 'the hazard map',
  SOS: 'emergency assistance',
  DASHBOARD: 'the dashboard',
  CALL_CONTACT: 'your trusted contacts',
  TRUSTED_CONTACTS: 'your trusted contacts',
  NOTIFICATIONS: 'your notifications',
  SETTINGS: 'your settings',
  KNOWLEDGE_LOOKUP: 'the offline knowledge library',
  ADMIN_DASHBOARD: 'the administrator workspace',
};
const WAKE_WORD = /\b(?:bala|mala|baila|baala|balah|bye)\b|బాలా|బాల|बाला/i;

export function useBalaVoice(onIntent) {
  const { locale } = useLanguage();
  const speech = useOfflineSpeech();
  const [message, setMessage] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);
  const commandTimerRef = useRef(null);
  const pendingActionRef = useRef(null);
  const [wakeDetected, setWakeDetected] = useState(false);

  const speak = useCallback((text, onEnd) => {
    if (!window.speechSynthesis || !text) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    speakingRef.current = true;
    setSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text.replace(/\bBALA\b/gi, 'Bah-lah'));
    utterance.lang = locale;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      speakingRef.current = false;
      setSpeaking(false);
      onEnd?.();
    };
    utterance.onend = finish;
    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') finish();
    };
    window.speechSynthesis.speak(utterance);
  }, [locale]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    speakingRef.current = false;
    setSpeaking(false);
    speech.stop();
  }, [speech.stop]);

  const runCommand = useCallback(async (phrase) => {
    window.clearTimeout(commandTimerRef.current);
    const normalizedPhrase = normalizeVoiceCommand(phrase);
    const cleaned = normalizedPhrase.replace(WAKE_WORD, '').trim();
    const uiCommand = parseVoiceUiCommand(normalizedPhrase);

    if (uiCommand?.action === 'CANCEL') {
      pendingActionRef.current = null;
      setMessage('Cancelled. No control was activated.');
      speak('Cancelled. No control was activated.');
      return;
    }
    if (uiCommand?.action === 'CONFIRM') {
      const pendingAction = pendingActionRef.current;
      pendingActionRef.current = null;
      if (!pendingAction) {
        setMessage('There is no pending action to confirm.');
        speak('There is no pending action to confirm.');
        return;
      }
      if (Date.now() > pendingAction.expiresAt) {
        setMessage('That confirmation expired. Please repeat the action if you still want to continue.');
        speak('That confirmation expired. Please repeat the action if you still want to continue.');
        return;
      }
      const result = activateConfirmedVoiceControl(pendingAction.element);
      const response = result.error || result.message;
      setMessage(response);
      speak(response);
      return;
    }
    if (uiCommand) {
      const result = executeVoiceUiCommand(uiCommand);
      if (result.confirmationRequired) {
        pendingActionRef.current = { element: result.element, expiresAt: Date.now() + 60_000 };
        const confirmation = `This may ${result.label.toLowerCase()}. Say “confirm” to continue, or “cancel that” to leave it unchanged.`;
        setMessage(confirmation);
        speak(confirmation);
        return;
      }
      if (!result.notFound) {
        const response = result.error || result.message;
        setMessage(response);
        speak(response);
        return;
      }
    }

    pendingActionRef.current = null;
    if (findVoiceIntent(normalizedPhrase) === 'STOP') {
      speak('BALA is going to sleep.');
      return;
    }
    if (!cleaned) {
      speak('BALA is ready. Choose a tool, or tell me what you need.');
      return;
    }
    if (findVoiceIntent(normalizedPhrase) === 'HELP') {
      const help = 'You can ask me to open any BALA feature, describe your surroundings, read a document, find a volunteer, report a hazard, get directions, or ask about an animal or resource. Speak naturally; I correct common command mispronunciations. I transcribe after you pause, or you can press the microphone to stop sooner. On a page, say “read this screen”, “scroll down”, “focus field destination”, “type the library into destination”, “open camera”, “take a photo”, “ask BALA”, or “activate button submit report”. I ask you to confirm before sending, saving, calling, or deleting. Say “cancel that” to cancel a pending action.';
      setMessage(help);
      speak(help);
      return;
    }

    setMessage('');
    try {
      let intent = findVoiceIntent(normalizedPhrase);
      if (!intent && navigator.onLine) {
        const response = await api.post('/voice/command', { phrase: normalizedPhrase, language: locale.slice(0, 2) });
        const serverIntent = response.data.data.intent;
        if (VOICE_INTENT_PATHS[serverIntent]) intent = serverIntent;
      }
      const path = VOICE_INTENT_PATHS[intent];
      if (path) {
        const label = INTENT_LABELS[intent];
        const instructions = {
          SCENE_DESCRIPTION: 'Take or choose a photo to describe the scene.',
          OBSTACLE_DETECTION: 'Take or choose a photo to check for visible obstacles. Do not rely on this as a safety system.',
          DOCUMENT_READER: 'Take a photo or choose a document image, and I will read the text aloud.',
          BILL_READER: 'Take or choose a clear photo. Please verify important amounts.',
          VOLUNTEER_REQUEST: isVolunteerConnectionRequest(normalizedPhrase)
            ? 'I will ask BALA’s AI volunteer to help first. Review and send your request on the volunteer page. If the AI cannot respond within 60 seconds, BALA will forward it to human volunteers. You can ask for a person at any time.'
            : 'Here are verified volunteers. Say request a volunteer if you want to join the help queue.',
          REPORT_HAZARD: 'I opened the hazard report. Tell me the hazard description, then say “activate button use my current location”. I will not submit a public report without your confirmation.',
          START_NAVIGATION: 'Share your location to check nearby hazard alerts, then open the walking route in Google Maps. Google Maps provides the directions; BALA cannot guarantee that a route is accessible or safe.',
          NAVIGATION: 'Share your location to check nearby hazard alerts, then open the walking route in Google Maps. Google Maps provides the directions; BALA cannot guarantee that a route is accessible or safe.',
          STOP_NAVIGATION: 'I will stop your BALA location-alert session and clear its saved location.',
          KNOWLEDGE_LOOKUP: 'I will look up the item in BALA’s offline starter library.',
          CURRENT_LOCATION: 'I will get your current location and check nearby verified hazard alerts.',
          CALL_CONTACT: 'Your trusted contacts are open. Choose the right person and press Call to confirm. I will not place a call automatically.',
          SOS: 'The SOS page is open. Nothing has been sent. Review the details and confirm before sending.',
        };
        const instruction = instructions[intent] || '';
        const confirmation = `I heard: “${normalizedPhrase}”. Opening ${label}.${instruction ? ` ${instruction}` : ''}`;
        setMessage(confirmation);
        window.clearTimeout(commandTimerRef.current);
        commandTimerRef.current = window.setTimeout(() => onIntent(path, intent, normalizedPhrase), 10_000);
        speak(confirmation, () => {
          window.clearTimeout(commandTimerRef.current);
          onIntent(path, intent, normalizedPhrase);
        });
      } else {
        const help = `I heard: “${normalizedPhrase}”, but could not confidently match it to a BALA feature or visible control. Please repeat it with different words, or say “help” for examples.`;
        setMessage(help);
        speak(help);
      }
    } catch (error) {
      const fallbackIntent = findVoiceIntent(normalizedPhrase);
      const fallbackPath = VOICE_INTENT_PATHS[fallbackIntent];
      if (!error.response && fallbackPath) {
        const fallbackMessage = `I heard: “${normalizedPhrase}”. The server is unavailable, but I am opening ${INTENT_LABELS[fallbackIntent]}. This tool may need an internet connection.`;
        setMessage(fallbackMessage);
        commandTimerRef.current = window.setTimeout(() => onIntent(fallbackPath, fallbackIntent, normalizedPhrase), 10_000);
        speak(fallbackMessage, () => {
          window.clearTimeout(commandTimerRef.current);
          onIntent(fallbackPath, fallbackIntent, normalizedPhrase);
        });
      } else {
        setMessage(error.response?.data?.message || 'The command could not be processed. You can choose a tool below.');
      }
    }
  }, [locale, onIntent, speak]);

  useEffect(() => {
    if (!speech.transcript) return;
    setWakeDetected(WAKE_WORD.test(speech.transcript));
    void runCommand(speech.transcript);
  }, [runCommand, speech.transcript]);

  useEffect(() => () => {
    window.clearTimeout(commandTimerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const start = useCallback(() => {
    window.clearTimeout(commandTimerRef.current);
    window.speechSynthesis?.cancel();
    speakingRef.current = false;
    setSpeaking(false);
    setWakeDetected(false);
    setMessage('');
    void speech.start();
  }, [speech.start]);

  const state = speech.state === 'RECORDING'
    ? 'LISTENING_FOR_BALA'
    : speech.state === 'REQUESTING' || speech.state === 'TRANSCRIBING'
      ? 'PROCESSING'
      : speaking || speakingRef.current
        ? 'SPEAKING'
        : speech.state === 'ERROR'
          ? 'ERROR'
          : 'IDLE';

  return {
    state,
    message: message || speech.message,
    recordingSeconds: speech.recordingSeconds,
    inputLevel: speech.inputLevel,
    transcript: normalizeVoiceCommand(speech.transcript),
    supported: Boolean(navigator.mediaDevices?.getUserMedia && window.AudioWorkletNode && (window.AudioContext || window.webkitAudioContext)),
    wakeDetected,
    start,
    stop,
    speak,
  };
}
