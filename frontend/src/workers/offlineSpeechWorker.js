import { pipeline } from '@huggingface/transformers';

const MODEL_ID = 'onnx-community/whisper-tiny';
let transcriberPromise;

async function getTranscriber(requestId) {
  if (!transcriberPromise) {
    self.postMessage({ type: 'progress', requestId, message: 'Preparing the offline speech model…' });
    transcriberPromise = pipeline('automatic-speech-recognition', MODEL_ID, {
      dtype: 'q4',
      progress_callback: (progress) => {
        if (progress.status === 'progress' && progress.total) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          self.postMessage({
            type: 'progress',
            requestId,
            message: `Downloading the offline speech model (${percent}%). This is needed only the first time.`,
          });
        }
      },
    });
  }
  return transcriberPromise;
}

self.onmessage = async ({ data }) => {
  if (data.type !== 'transcribe') return;
  try {
    const transcriber = await getTranscriber(data.requestId);
    self.postMessage({ type: 'progress', requestId: data.requestId, message: 'Transcribing on this device…' });
    const result = await transcriber(data.audio, {
      task: 'transcribe',
      sampling_rate: 16_000,
      temperature: 0,
      num_beams: 5,
      no_speech_threshold: 0.6,
      logprob_threshold: -1,
      condition_on_prev_tokens: false,
    });
    self.postMessage({ type: 'result', requestId: data.requestId, text: result?.text || '' });
  } catch (error) {
    transcriberPromise = undefined;
    self.postMessage({
      type: 'error',
      requestId: data.requestId,
      message: error.message || 'Offline speech recognition could not finish.',
    });
  }
};
