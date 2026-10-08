const MAX_TRANSCRIPT_CHARACTERS = 240;
const ALLOWED_TRANSCRIPT_CHARACTERS = /[^\p{Script=Latin}\p{Script=Devanagari}\p{Script=Telugu}\p{N}\s.,!?¿¡'"’“”‘’…:;()\-]/u;

function hasRepeatedPhrase(phrase) {
  const compact = phrase.replace(/[^\p{L}\p{N}]/gu, '').toLocaleLowerCase();
  if (compact.length < 32) return false;

  const minimumRepeatedCharacters = Math.max(16, Math.ceil(compact.length * 0.4));
  for (let period = 1; period <= Math.min(32, Math.floor(compact.length / 3)); period += 1) {
    for (let start = 0; start <= compact.length - period * 3; start += 1) {
      let repeatedCharacters = period;
      while (
        start + repeatedCharacters < compact.length
        && compact[start + repeatedCharacters] === compact[start + repeatedCharacters - period]
      ) {
        repeatedCharacters += 1;
      }
      if (repeatedCharacters >= minimumRepeatedCharacters) return true;
    }
  }
  return false;
}

export function validateVoiceTranscript(value) {
  const transcript = typeof value === 'string' ? value.trim() : '';
  if (!transcript || [...transcript].length > MAX_TRANSCRIPT_CHARACTERS) return '';
  if (ALLOWED_TRANSCRIPT_CHARACTERS.test(transcript) || hasRepeatedPhrase(transcript)) return '';
  return transcript;
}
