let worker;
let requestId = 0;
const pending = new Map();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('../workers/offlineSpeechWorker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    const request = pending.get(data.requestId);
    if (!request) return;
    if (data.type === 'progress') {
      request.onProgress?.(data.message);
    } else {
      pending.delete(data.requestId);
      if (data.type === 'result') request.resolve(data.text);
      else request.reject(new Error(data.message));
    }
  };
  worker.onerror = () => {
    for (const request of pending.values()) request.reject(new Error('Offline speech recognition could not start.'));
    pending.clear();
    worker?.terminate();
    worker = undefined;
  };
  return worker;
}

export function transcribeOfflineAudio(audio, onProgress) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject, onProgress });
    try {
      getWorker().postMessage({ type: 'transcribe', requestId: id, audio }, [audio.buffer]);
    } catch (error) {
      pending.delete(id);
      reject(error);
    }
  });
}
