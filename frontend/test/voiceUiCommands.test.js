import assert from 'node:assert/strict';
import test from 'node:test';
import { parseVoiceUiCommand } from '../src/services/voiceUiCommands.js';
import { findVoiceIntent, VOICE_INTENT_PATHS } from '../src/services/voiceCommands.js';

test('voice UI commands support screen reading and page movement', () => {
  assert.deepEqual(parseVoiceUiCommand('BALA read this screen'), { action: 'READ_SCREEN' });
  assert.deepEqual(parseVoiceUiCommand('scroll down'), { action: 'SCROLL', direction: 'down' });
  assert.deepEqual(parseVoiceUiCommand('go to the top'), { action: 'SCROLL_TO', position: 'top' });
});

test('voice UI commands can focus, fill, and select labeled form controls', () => {
  assert.deepEqual(parseVoiceUiCommand('focus field destination'), { action: 'FOCUS_FIELD', target: 'destination' });
  assert.deepEqual(parseVoiceUiCommand('type the library into destination'), { action: 'FILL_FIELD', value: 'the library', target: 'destination' });
  assert.deepEqual(parseVoiceUiCommand('select blocked sidewalk for hazard category'), { action: 'SELECT_OPTION', value: 'blocked sidewalk', target: 'hazard category' });
  assert.deepEqual(parseVoiceUiCommand('check consent'), { action: 'SET_CHECKED', checked: true, target: 'consent' });
  assert.deepEqual(parseVoiceUiCommand('uncheck large text'), { action: 'SET_CHECKED', checked: false, target: 'large text' });
});

test('voice activation and confirmation are explicit commands', () => {
  assert.deepEqual(parseVoiceUiCommand('activate button submit report'), { action: 'ACTIVATE_CONTROL', target: 'submit report' });
  assert.deepEqual(parseVoiceUiCommand('open camera'), { action: 'ACTIVATE_CONTROL', target: 'camera' });
  assert.deepEqual(parseVoiceUiCommand('take a photo'), { action: 'ACTIVATE_CONTROL', target: 'capture photo' });
  assert.deepEqual(parseVoiceUiCommand('ask BALA'), { action: 'ACTIVATE_CONTROL', target: 'ask bala' });
  assert.deepEqual(parseVoiceUiCommand('send SOS'), { action: 'ACTIVATE_CONTROL', target: 'send sos' });
  assert.deepEqual(parseVoiceUiCommand('confirm'), { action: 'CONFIRM' });
  assert.deepEqual(parseVoiceUiCommand('cancel that'), { action: 'CANCEL' });
  assert.deepEqual(parseVoiceUiCommand('where am I'), { action: 'ACTIVATE_CONTROL', target: 'my location' });
  assert.deepEqual(parseVoiceUiCommand('share my current location'), { action: 'ACTIVATE_CONTROL', target: 'my location' });
  assert.equal(parseVoiceUiCommand('tell me about a dog'), null);
});

test('all application workspaces resolve to protected application routes', () => {
  const commands = [
    ['open the scene page', '/app/scene'],
    ['open obstacles', '/app/obstacles'],
    ['open document reader', '/app/document'],
    ['open currency reader', '/app/currency'],
    ['open volunteer page', '/app/volunteers'],
    ['open hazard reporting', '/app/hazards'],
    ['open navigation', '/app/navigation'],
    ['open hazard map', '/app/map'],
    ['open emergency support', '/app/sos'],
    ['open trusted contacts', '/app/contacts'],
    ['open notifications', '/app/notifications'],
    ['open settings', '/app/settings'],
    ['open the knowledge library', '/app/learn'],
    ['open admin dashboard', '/app/admin'],
  ];
  for (const [phrase, path] of commands) {
    assert.equal(VOICE_INTENT_PATHS[findVoiceIntent(phrase)], path, phrase);
  }
});

test('Spanish voice commands resolve to their application workspaces', () => {
  const commands = [
    ['BALA describe mi entorno', '/app/scene'],
    ['BALA detecta obstáculos', '/app/obstacles'],
    ['BALA lee el documento', '/app/document'],
    ['BALA lee mi factura', '/app/currency'],
    ['BALA busca un voluntario', '/app/volunteers'],
    ['BALA informa de un bache', '/app/hazards'],
    ['BALA dónde estoy', '/app/navigation'],
    ['BALA mapa de riesgos cercanos', '/app/map'],
    ['BALA ajustes de accesibilidad', '/app/settings'],
    ['BALA contactos de emergencia', '/app/contacts'],
    ['BALA emergencia', '/app/sos'],
  ];
  for (const [phrase, path] of commands) {
    assert.equal(VOICE_INTENT_PATHS[findVoiceIntent(phrase)], path, phrase);
  }
});
