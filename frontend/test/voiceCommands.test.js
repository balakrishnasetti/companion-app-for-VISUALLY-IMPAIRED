import test from 'node:test';
import assert from 'node:assert/strict';
import { findVoiceIntent, normalizeVoiceCommand, extractNavigationDestination } from '../src/services/voiceCommands.js';

test('corrects common spoken and speech-recognition variants before routing', () => {
  const examples = [
    ['BALA, please read the documant', 'DOCUMENT_READER'],
    ['can you describe my suroundings', 'SCENE_DESCRIPTION'],
    ['BALA find a voluntier', 'VOLUNTEER_REQUEST'],
    ['Waala, fine day, Walanteal.', 'VOLUNTEER_REQUEST'],
    ['Walla find day Walanteal', 'VOLUNTEER_REQUEST'],
    ['BALA report the hazerd', 'REPORT_HAZARD'],
    ['BALA navigate to the libary', 'START_NAVIGATION'],
    ['BALA, is the path clear?', 'OBSTACLE_DETECTION'],
    ['BALA read it aloud', 'DOCUMENT_READER'],
    ['BALA what is around me', 'SCENE_DESCRIPTION'],
    ['BALA what am I looking at', 'SCENE_DESCRIPTION'],
    ['BALA describe the area', 'SCENE_DESCRIPTION'],
    ['BALA check for obstacles ahead', 'OBSTACLE_DETECTION'],
    ['BALA read this page to me', 'DOCUMENT_READER'],
    ['BALA report a hazzard', 'REPORT_HAZARD'],
    ['BALA report a pothol', 'REPORT_HAZARD'],
    ['BALA open navigashion to the station', 'START_NAVIGATION'],
    ['BALA show me my surounding', 'SCENE_DESCRIPTION'],
  ];

  for (const [phrase, intent] of examples) {
    assert.equal(findVoiceIntent(normalizeVoiceCommand(phrase)), intent, phrase);
  }
});

test('corrects the reported volunteer transcript to a clear command', () => {
  assert.equal(normalizeVoiceCommand('Waala, fine day, Walanteal.'), 'BALA find a volunteer');
});

test('keeps corrected navigation destinations and removes polite filler', () => {
  const phrase = normalizeVoiceCommand('BALA, could you navigate to the libary, please?');
  assert.equal(phrase, 'BALA, navigate to the library, please?');
  assert.equal(extractNavigationDestination(phrase), 'library');
});

test('does not remove supported Telugu commands while normalizing voice input', () => {
  assert.equal(findVoiceIntent(normalizeVoiceCommand('బాలా పరిసరాలను వివరించు')), 'SCENE_DESCRIPTION');
  assert.equal(findVoiceIntent(normalizeVoiceCommand('బాలా పత్రం చదవండి')), 'DOCUMENT_READER');
});
