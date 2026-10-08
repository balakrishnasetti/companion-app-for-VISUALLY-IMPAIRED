import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createWorker } from 'tesseract.js';
import { AlertTriangle, Camera, Check, CircleHelp, FileText, ImagePlus, LoaderCircle, Pause, Play, RotateCcw, Save, Square, Volume2, WalletCards, Eye, Accessibility } from 'lucide-react';
import FeatureHeader from '../components/FeatureHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api, { apiMessage } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { LANGUAGE_BY_CODE } from '../constants/languages.js';

const tasks = {
  scene: {
    titleKey: 'sceneTitle',
    title: 'Describe surroundings',
    description: 'Take or choose a photo. BALA will describe what it can see, carefully.',
    icon: Eye,
    endpoint: '/ai/scene-description',
    loading: 'Looking at your image…',
    caution: 'Image descriptions may be wrong or incomplete. Use your normal mobility aids.',
  },
  obstacles: {
    titleKey: 'obstacleTitle',
    title: 'Detect obstacles',
    description: 'Ask for a cautious description of visible obstacles and their approximate position.',
    icon: Accessibility,
    endpoint: '/ai/obstacle-detection',
    loading: 'Checking the image for visible obstacles…',
    caution: 'This is not a collision-avoidance system. AI detection can miss hazards or make mistakes.',
  },
  currency: {
    titleKey: 'currencyTitle',
    title: 'Read currency or a bill',
    description: 'Capture a banknote or invoice. BALA only reports amounts it can read clearly.',
    icon: WalletCards,
    endpoint: '/ai/currency-reader',
    loading: 'Reading visible text and amounts…',
    caution: 'Please verify important financial details. Unclear amounts will not be guessed.',
  },
};

function languageCode(language) {
  return LANGUAGE_BY_CODE[language]?.tesseract || LANGUAGE_BY_CODE.en.tesseract;
}

async function optimizeImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file such as JPEG, PNG, or WebP.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Choose an image smaller than 15 MB.');
  let source;
  let releaseSource = () => {};
  if (window.createImageBitmap) {
    source = await createImageBitmap(file);
    releaseSource = () => source.close();
  } else {
    const objectUrl = URL.createObjectURL(file);
    source = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('This image could not be opened. Choose another image.'));
      image.src = objectUrl;
    });
    releaseSource = () => URL.revokeObjectURL(objectUrl);
  }
  const scale = Math.min(1, 1400 / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  releaseSource();
  return canvas.toDataURL('image/jpeg', 0.82);
}

function useSpeak() {
  const { locale } = useLanguage();
  const rate = useAuth().user?.accessibility?.speechRate || 1;
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }, [locale, rate]);
  return speak;
}

function CameraCapture({ onCapture, onError, onReady }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

  const openCamera = async () => {
    onError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      onError('Camera access is unavailable in this browser. Use the photo upload control instead.');
      return;
    }
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      setStream(nextStream);
      onReady('Camera is ready. Say “take a photo” when you are ready.');
    } catch (problem) {
      const message = problem.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access in your browser settings and try again.'
        : problem.name === 'NotFoundError'
          ? 'No camera was found on this device.'
          : `The camera could not be opened: ${problem.message || 'Please check your browser and device settings.'}`;
      onError(message);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      onError('The camera is not ready yet. Wait for the preview, then say “take a photo”.');
      return;
    }
    const scale = Math.min(1, 1400 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/jpeg', 0.82);
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    onError('');
    onCapture(image);
  };

  return (
    <div className="camera-capture">
      {stream ? (
        <>
          <video ref={videoRef} className="camera-capture-preview" autoPlay playsInline muted aria-label="Live camera preview" />
          <div className="button-row">
            <button type="button" className="button button-lime" onClick={capturePhoto}><Camera size={16} />Capture photo</button>
            <button type="button" className="button button-outline" onClick={() => { stream.getTracks().forEach((track) => track.stop()); setStream(null); }}>Stop camera</button>
          </div>
        </>
      ) : (
        <button type="button" className="button button-outline" onClick={openCamera}><Camera size={16} />Open camera</button>
      )}
    </div>
  );
}

export default function CameraTask({ type }) {
  const task = tasks[type];
  const location = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const speak = useSpeak();
  const fileRef = useRef(null);
  const [image, setImage] = useState('');
  const [imageName, setImageName] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (type !== 'document') return undefined;
    api.get('/documents').then((response) => setHistory(response.data.data.documents)).catch(() => {});
    return undefined;
  }, [type]);

  const chooseFile = async (file) => {
    if (!file) return;
    setError('');
    setResult('');
    setSaved(false);
    try {
      const optimized = await optimizeImage(file);
      setImage(optimized);
      setImageName(file.name || 'Camera image');
      if (type === 'document') void recognizeText(optimized);
    } catch (problem) {
      setError(problem.message);
      setImage('');
    }
  };

  const analyze = async () => {
    setBusy(true);
    setError('');
    setResult('');
    try {
      const response = await api.post(task.endpoint, { image, language });
      setResult(response.data.data.text);
      speak(response.data.data.text);
    } catch (problem) {
      setError(apiMessage(problem));
    } finally {
      setBusy(false);
    }
  };

  async function recognizeText(sourceImage = image) {
    setBusy(true);
    setProgress(0);
    setError('');
    setResult('');
    let worker;
    try {
      worker = await createWorker(languageCode(language), 1, {
        logger: (status) => {
          if (typeof status.progress === 'number') setProgress(Math.round(status.progress * 100));
        },
      });
      const { data } = await worker.recognize(sourceImage);
      const text = data.text.trim();
      if (!text) throw new Error('No readable text was found. Try a sharper photo with better lighting.');
      setResult(text);
      speak(text);
    } catch (problem) {
      setError(problem.message || 'Text recognition could not finish. Check your connection and try again.');
    } finally {
      await worker?.terminate();
      setBusy(false);
    }
  }

  useEffect(() => {
    if (type !== 'document' || location.state?.voiceIntent !== 'DOCUMENT_READER') return;
    speak('Document reader ready. Take a photo or choose a document image, and I will read the text aloud.');
  }, [location.state, speak, type]);

  const saveDocument = async () => {
    if (!result.trim()) return;
    setBusy(true);
    setError('');
    try {
      const response = await api.post('/documents', { name: imageName || 'Scanned document', text: result, language });
      setHistory((previous) => [response.data.data.document, ...previous]);
      setSaved(true);
    } catch (problem) {
      setError(apiMessage(problem));
    } finally {
      setBusy(false);
    }
  };

  const removeDocument = async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      setHistory((previous) => previous.filter((item) => item._id !== id));
    } catch (problem) {
      setError(apiMessage(problem));
    }
  };

  const useCapturedImage = (capturedImage) => {
    setImage(capturedImage);
    setImageName('Camera capture');
    setResult('');
    setSaved(false);
    if (type === 'document') void recognizeText(capturedImage);
    else speak('Photo captured. Say “ask BALA” when you are ready to analyze it.');
  };

  if (type === 'document') {
    return (
      <div className="tool-page">
        <FeatureHeader titleKey="documentTitle" description="Take a photo or upload a document image. Text is recognized on this device and is only saved if you choose." icon={FileText} />
        <div className="tool-layout">
          <section className="tool-card"><h2>Choose a document</h2><p className="muted-copy">OCR language: {LANGUAGE_BY_CODE[language]?.label || 'English'}. Processing runs in your browser.</p>
            <CameraCapture onCapture={useCapturedImage} onError={setError} onReady={speak} />
            <input ref={fileRef} className="sr-only" type="file" accept="image/*" capture="environment" aria-label="Take or upload document image" onChange={(event) => chooseFile(event.target.files?.[0])} />
            <button type="button" className="upload-zone" onClick={() => fileRef.current?.click()}><span className="upload-icon"><Camera size={22} /></span><strong>Take a photo or upload</strong><span>Tap here to use your camera or select an image</span><span className="upload-badges"><span><Camera size={14} /> CAMERA</span><span><ImagePlus size={14} /> IMAGE</span></span></button>
            {image && <div className="selected-image"><img src={image} alt={`Selected document: ${imageName}`} /><div><strong>{imageName}</strong><span>Ready to read</span></div></div>}
            {image && <button type="button" className="button button-dark full-button" onClick={recognizeText} disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} /> Recognizing text — {progress}%</> : <><FileText size={16} /> Read document text</>}</button>}
            {result && <div className="document-result"><label htmlFor="ocr-result">Recognized text</label><textarea id="ocr-result" rows="8" value={result} onChange={(event) => setResult(event.target.value)} /><div className="result-actions"><button type="button" className="button button-outline" onClick={() => speak(result)}><Volume2 size={16} /> Read aloud</button><button type="button" className="button button-outline" onClick={() => window.speechSynthesis?.pause()}><Pause size={15} /> Pause</button><button type="button" className="button button-outline" onClick={() => window.speechSynthesis?.resume()}><Play size={15} /> Resume</button><button type="button" className="button button-outline" onClick={() => window.speechSynthesis?.cancel()}><Square size={14} /> Stop</button><button type="button" className="button button-lime" onClick={saveDocument} disabled={busy || saved}><Save size={15} /> {saved ? 'Saved' : 'Save to history'}</button></div><p className="privacy-note"><CircleHelp size={15} />This text is not saved unless you press “Save to history”.</p></div>}
          </section>
          <aside className="side-card"><span className="side-card-icon"><ShieldCheckIcon /></span><h3>Your document stays private</h3><p>Text recognition takes place in this browser. The original image is not sent to BALA's server.</p><div className="side-divider" /><h3>Tips for a clearer scan</h3><ul><li>Lay the page on a flat surface</li><li>Use even, bright lighting</li><li>Keep the whole page in frame</li><li>Use the right language setting</li></ul></aside>
        </div>
        {error && <div className="inline-error" role="alert"><AlertTriangle size={17} />{error}<button type="button" onClick={recognizeText}>Try again</button></div>}
        <section className="history-section"><div className="section-subheading"><div><h2>Saved document history</h2><p>Only documents you chose to save appear here.</p></div></div>{history.length ? <ul className="history-list">{history.map((item) => <li key={item._id}><span className="history-icon"><FileText size={18} /></span><span><strong>{item.name}</strong><small>{new Date(item.createdAt).toLocaleDateString()}</small></span><button className="text-button" type="button" onClick={() => removeDocument(item._id)} aria-label={`Delete ${item.name}`}>Delete</button></li>)}</ul> : <p className="empty-state">No saved documents yet.</p>}</section>
      </div>
    );
  }

  return (
    <div className="tool-page">
      <FeatureHeader titleKey={task.titleKey} description={task.description} icon={task.icon} />
      <div className="tool-layout">
        <section className="tool-card"><h2>Capture or choose an image</h2><p className="muted-copy">Images are sent securely to the configured AI service through BALA's backend for analysis.</p>
          <CameraCapture onCapture={useCapturedImage} onError={setError} onReady={speak} />
          <input ref={fileRef} className="sr-only" type="file" accept="image/*" capture="environment" aria-label="Take or upload an image" onChange={(event) => chooseFile(event.target.files?.[0])} />
          <button type="button" className="upload-zone" onClick={() => fileRef.current?.click()}><span className="upload-icon"><Camera size={22} /></span><strong>Take a photo or upload</strong><span>Use your camera or choose an image from this device</span><span className="upload-badges"><span><Camera size={14} /> CAMERA</span><span><ImagePlus size={14} /> IMAGE</span></span></button>
          {image && <div className="selected-image"><img src={image} alt={`Selected image: ${imageName}`} /><div><strong>{imageName}</strong><span>Ready for BALA</span></div></div>}
          {image && <button type="button" className="button button-dark full-button" onClick={analyze} disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} />{task.loading}</> : <><Eye size={16} /> Ask BALA</>}</button>}
          {error && <div className="inline-error" role="alert"><AlertTriangle size={17} /><span>{error}</span>{image && <button type="button" onClick={analyze}>Try again</button>}</div>}
          {result && <div className="vision-result" role="status"><div className="result-heading"><span><Check size={16} /> BALA's description</span><span className="uncertainty-label"><CircleHelp size={14} /> Please verify</span></div><p>{result}</p><div className="result-actions"><button type="button" className="button button-outline" onClick={() => speak(result)}><Volume2 size={16} /> Read aloud</button><button type="button" className="button button-outline" onClick={() => window.speechSynthesis?.pause()}><Pause size={15} /> Pause</button><button type="button" className="button button-outline" onClick={() => window.speechSynthesis?.resume()}><Play size={15} /> Resume</button><button type="button" className="button button-outline" onClick={() => window.speechSynthesis?.cancel()}><Square size={14} /> Stop</button><button type="button" className="button button-quiet" onClick={analyze} disabled={busy}><RotateCcw size={15} /> Retry</button></div></div>}
        </section>
        <aside className="side-card"><span className="side-card-icon"><CircleHelp size={20} /></span><h3>Keep this in mind</h3><p>{task.caution}</p><div className="side-divider" /><h3>Your privacy matters</h3><p>Images are used for this request only and are not saved in your BALA document history.</p></aside>
      </div>
    </div>
  );
}

function ShieldCheckIcon() {
  return <Check size={20} />;
}
