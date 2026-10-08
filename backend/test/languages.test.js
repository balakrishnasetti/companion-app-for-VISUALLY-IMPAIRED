const test = require('node:test');
const assert = require('node:assert/strict');
const { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } = require('../src/constants/languages');
const UserPreference = require('../src/models/UserPreference');
const Document = require('../src/models/Document');
const OCRResult = require('../src/models/OCRResult');
const VoiceCommand = require('../src/models/VoiceCommand');
const VolunteerRequest = require('../src/models/VolunteerRequest');
const Volunteer = require('../src/models/Volunteer');

test('Spanish is consistently accepted and named in the backend language registry', () => {
  assert.deepEqual(SUPPORTED_LANGUAGES, ['en', 'te', 'hi', 'es']);
  assert.equal(LANGUAGE_NAMES.es, 'Spanish');
  assert.deepEqual(UserPreference.schema.path('language').enumValues, SUPPORTED_LANGUAGES);
  assert.deepEqual(Document.schema.path('language').enumValues, SUPPORTED_LANGUAGES);
  assert.deepEqual(OCRResult.schema.path('language').enumValues, SUPPORTED_LANGUAGES);
  assert.deepEqual(VoiceCommand.schema.path('language').enumValues, SUPPORTED_LANGUAGES);
  assert.deepEqual(VolunteerRequest.schema.path('language').enumValues, SUPPORTED_LANGUAGES);
  assert.deepEqual(Volunteer.schema.path('languages').caster.enumValues, SUPPORTED_LANGUAGES);
});
