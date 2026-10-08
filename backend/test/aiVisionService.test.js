const test = require('node:test');
const assert = require('node:assert/strict');
const { describeImage } = require('../src/services/aiVisionService');

test('AI vision features fail explicitly if no provider key is configured', async () => {
  const previous = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    await assert.rejects(
      describeImage('data:image/jpeg;base64,dGVzdA==', 'Describe the image.'),
      (error) => error.statusCode === 503
        && /photo is selected and previewed/.test(error.message)
        && /backend\/\.env/.test(error.message)
        && /Never put the key in the frontend/.test(error.message),
    );
  } finally {
    if (previous !== undefined) process.env.AI_API_KEY = previous;
  }
});

test('AI vision rejects unsupported image types before contacting a provider', async () => {
  const previous = process.env.AI_API_KEY;
  process.env.AI_API_KEY = 'test-only-placeholder';
  try {
    await assert.rejects(
      describeImage('data:text/plain;base64,dGVzdA==', 'Describe the image.'),
      (error) => error.statusCode === 400,
    );
  } finally {
    if (previous === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = previous;
  }
});
