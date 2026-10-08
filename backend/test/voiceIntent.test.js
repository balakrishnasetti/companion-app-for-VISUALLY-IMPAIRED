const test = require('node:test');
const assert = require('node:assert/strict');
const { parseVoiceIntent } = require('../src/services/voiceIntent');

test('BALA wake word and scene command become a structured intent', () => {
  assert.deepEqual(parseVoiceIntent('BALA, describe my surroundings'), {
    activated: true,
    intent: 'SCENE_DESCRIPTION',
  });
});

test('BALA stop, deactivate, and sleep commands deactivate the assistant', () => {
  for (const phrase of ['BALA stop', 'BALA deactivate', 'BALA sleep']) {
    assert.equal(parseVoiceIntent(phrase).intent, 'STOP');
  }
});

test('common accessibility commands map to the expected intents', () => {
  const examples = [
    ['BALA detect obstacles', 'OBSTACLE_DETECTION'],
    ['BALA read this document', 'DOCUMENT_READER'],
    ['BALA read a document', 'DOCUMENT_READER'],
    ['BALA read my document', 'DOCUMENT_READER'],
    ['BALA red document', 'DOCUMENT_READER'],
    ['BALA scan this page', 'DOCUMENT_READER'],
    ['BALA read this bill', 'BILL_READER'],
    ['BALA find a volunteer', 'VOLUNTEER_REQUEST'],
    ['BALA connect me with a volunteer', 'VOLUNTEER_REQUEST'],
    ['BALA connect volunteer', 'VOLUNTEER_REQUEST'],
    ['BALA connect me to a person', 'VOLUNTEER_REQUEST'],
    ['BALA I need a volunteer', 'VOLUNTEER_REQUEST'],
    ['BALA talk to a human volunteer', 'VOLUNTEER_REQUEST'],
    ['BALA find a voluntier', 'VOLUNTEER_REQUEST'],
    ['BALA show available volunteers', 'VOLUNTEER_REQUEST'],
    ['BALA request help', 'VOLUNTEER_REQUEST'],
    ['BALA open the documant', 'DOCUMENT_READER'],
    ['BALA check for obsticals', 'OBSTACLE_DETECTION'],
    ['BALA report a hazard', 'REPORT_HAZARD'],
    ['BALA where am I', 'CURRENT_LOCATION'],
    ['BALA send SOS', 'SOS'],
    ['BALA open settings', 'SETTINGS'],
    ['BALA show notifications', 'NOTIFICATIONS'],
    ['BALA show my trusted contacts', 'TRUSTED_CONTACTS'],
    ['BALA open the knowledge library', 'KNOWLEDGE_LOOKUP'],
    ['BALA open the administrator dashboard', 'ADMIN_DASHBOARD'],
    ['BALA open moderator workspace', 'ADMIN_DASHBOARD'],
    ['BALA open emergency support', 'SOS'],
    ['open the scene page', 'SCENE_DESCRIPTION'],
    ['go to the document reader', 'DOCUMENT_READER'],
    ['open the currency reader', 'BILL_READER'],
    ['open the volunteer page', 'VOLUNTEER_REQUEST'],
    ['show the hazard reporting page', 'REPORT_HAZARD'],
    ['open the hazard map', 'HAZARD_MAP'],
    ['show nearby hazards', 'HAZARD_MAP'],
    ['show emergency contacts', 'TRUSTED_CONTACTS'],
    ['go to navigation alerts', 'NAVIGATION'],
    ['BALA emergency contacts', 'TRUSTED_CONTACTS'],
    ['BALA hazard map', 'HAZARD_MAP'],
    ['BALA navigation alerts', 'NAVIGATION'],
    ['BALA start navigation', 'START_NAVIGATION'],
    ['BALA start navigation to the station', 'START_NAVIGATION'],
    ['BALA stop navigation', 'STOP_NAVIGATION'],
    ['BALA call my emergency contact', 'CALL_CONTACT'],
    ['BALA what can you do', 'HELP'],
    ['show my location', 'CURRENT_LOCATION'],
    ['open the SOS page', 'SOS'],
  ];
  for (const [phrase, intent] of examples) assert.equal(parseVoiceIntent(phrase).intent, intent);
});

test('pronunciation-like document variants are corrected only in document context', () => {
  for (const phrase of ['BALA red document', 'BALA reed a document', 'BALA read my document', 'BALA read a red book']) {
    assert.equal(parseVoiceIntent(phrase).intent, 'DOCUMENT_READER');
  }
  assert.equal(parseVoiceIntent('BALA the red book is on the table').intent, 'UNKNOWN');
});

test('selected Telugu and Hindi commands are recognized', () => {
  assert.equal(parseVoiceIntent('BALA పరిసరాలను వివరించు').intent, 'SCENE_DESCRIPTION');
  assert.equal(parseVoiceIntent('BALA आसपास').intent, 'SCENE_DESCRIPTION');
  assert.equal(parseVoiceIntent('BALA दस्तावेज़ पढ़ें').intent, 'DOCUMENT_READER');
  assert.equal(parseVoiceIntent('BALA సహాయం').intent, 'VOLUNTEER_REQUEST');
});

test('Spanish voice commands route to the expected accessibility features', () => {
  const examples = [
    ['BALA describe mi entorno', 'SCENE_DESCRIPTION'],
    ['BALA detecta obstáculos', 'OBSTACLE_DETECTION'],
    ['BALA lee el documento', 'DOCUMENT_READER'],
    ['BALA lee mi factura', 'BILL_READER'],
    ['BALA busca un voluntario', 'VOLUNTEER_REQUEST'],
    ['BALA informa de un bache', 'REPORT_HAZARD'],
    ['BALA dónde estoy', 'CURRENT_LOCATION'],
    ['BALA mapa de riesgos cercanos', 'HAZARD_MAP'],
    ['BALA ajustes de accesibilidad', 'SETTINGS'],
    ['BALA contactos de emergencia', 'TRUSTED_CONTACTS'],
    ['BALA llévame a la estación', 'START_NAVIGATION'],
    ['BALA emergencia', 'SOS'],
  ];
  for (const [phrase, intent] of examples) assert.equal(parseVoiceIntent(phrase).intent, intent, phrase);
});

test('a wake word without a command activates BALA without inventing an intent', () => {
  assert.deepEqual(parseVoiceIntent('BALA'), { activated: true, intent: null });
  assert.deepEqual(parseVoiceIntent('bye'), { activated: true, intent: null });
  assert.deepEqual(parseVoiceIntent('unrelated words'), { activated: false, intent: null });
});

test('common wake-word transcription mistakes are corrected before intent detection', () => {
  assert.equal(parseVoiceIntent('mala describe my surroundings').intent, 'SCENE_DESCRIPTION');
  assert.equal(parseVoiceIntent('baila open settings').intent, 'SETTINGS');
  assert.equal(parseVoiceIntent('bye start navigation to the station').intent, 'START_NAVIGATION');
});

test('natural phrasing and pronunciation-like transcription errors route to the intended tools', () => {
  const examples = [
    ['BALA, please read the documant', 'DOCUMENT_READER'],
    ['can you describe my suroundings', 'SCENE_DESCRIPTION'],
    ['BALA find a voluntier', 'VOLUNTEER_REQUEST'],
    ['BALA report the hazerd', 'REPORT_HAZARD'],
    ['BALA navigate to the libary', 'START_NAVIGATION'],
    ['BALA, is the path clear?', 'OBSTACLE_DETECTION'],
    ['BALA read it aloud', 'DOCUMENT_READER'],
    ['BALA what is around me', 'SCENE_DESCRIPTION'],
  ];
  for (const [phrase, intent] of examples) assert.equal(parseVoiceIntent(phrase).intent, intent, phrase);
});

test('knowledge questions and spoken destination requests are recognized', () => {
  assert.equal(parseVoiceIntent('BALA what is a dog').intent, 'KNOWLEDGE_LOOKUP');
  assert.equal(parseVoiceIntent('tell me about water').intent, 'KNOWLEDGE_LOOKUP');
  assert.equal(parseVoiceIntent('BALA take me to the railway station').intent, 'START_NAVIGATION');
  assert.equal(parseVoiceIntent('BALA directions to Central Park').intent, 'START_NAVIGATION');
  assert.equal(parseVoiceIntent('go to settings').intent, 'SETTINGS');
});
