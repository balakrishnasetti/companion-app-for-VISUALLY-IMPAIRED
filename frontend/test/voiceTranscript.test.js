import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVoiceTranscript } from '../src/services/voiceTranscript.js';

test('keeps clear supported-language voice transcripts', () => {
  assert.equal(validateVoiceTranscript('describe my surroundings'), 'describe my surroundings');
  assert.equal(validateVoiceTranscript('నా చుట్టూ ఏముంది'), 'నా చుట్టూ ఏముంది');
  assert.equal(validateVoiceTranscript('मेरे आसपास क्या है'), 'मेरे आसपास क्या है');
  assert.equal(validateVoiceTranscript('¿Dónde está la biblioteca?'), '¿Dónde está la biblioteca?');
});

test('discards the unrelated-script text shown in the reported screenshot', () => {
  assert.equal(validateVoiceTranscript('传福传福传福传福传福传福传福传福传福传福传福传福'), '');
});

test('discards repeated hallucinations and oversized transcripts', () => {
  assert.equal(validateVoiceTranscript('navigate '.repeat(12)), '');
  assert.equal(validateVoiceTranscript('a'.repeat(241)), '');
  assert.equal(validateVoiceTranscript('   '), '');
});
