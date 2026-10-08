const test = require('node:test');
const assert = require('node:assert/strict');
const { respondToAssistance } = require('../src/services/aiVolunteerService');

test('AI volunteer falls back clearly when no provider is configured', async () => {
  const previousKey = process.env.AI_API_KEY;
  const previousFetch = global.fetch;
  delete process.env.AI_API_KEY;
  global.fetch = async () => { throw new Error('Provider should not be called.'); };
  try {
    await assert.rejects(
      respondToAssistance('I need help finding a document reader.'),
      (error) => error.statusCode === 503 && /human volunteer/.test(error.message),
    );
  } finally {
    if (previousKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = previousKey;
    global.fetch = previousFetch;
  }
});

test('AI volunteer returns a text response with AI and human handoff guardrails', async () => {
  const previousKey = process.env.AI_API_KEY;
  const previousBaseUrl = process.env.AI_BASE_URL;
  const previousModel = process.env.AI_MODEL;
  const previousFetch = global.fetch;
  let providerRequest;
  process.env.AI_API_KEY = 'test-only-placeholder';
  process.env.AI_BASE_URL = 'https://ai.example.test/v1/';
  process.env.AI_MODEL = 'test-model';
  global.fetch = async (url, options) => {
    providerRequest = { url, options };
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'I can explain how to open the document reader.' } }] }),
    };
  };
  try {
    const result = await respondToAssistance('Help me read a letter.', 'en');
    assert.equal(result.reply, 'I can explain how to open the document reader.');
    assert.equal(providerRequest.url, 'https://ai.example.test/v1/chat/completions');
    assert.equal(providerRequest.options.headers.Authorization, 'Bearer test-only-placeholder');
    const payload = JSON.parse(providerRequest.options.body);
    assert.equal(payload.messages[1].content, 'Help me read a letter.');
    assert.match(payload.messages[0].content, /not a human volunteer/);
    assert.match(payload.messages[0].content, /connect them to a human volunteer/);
    assert.match(payload.messages[0].content, /language code "en"/);
  } finally {
    if (previousKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = previousKey;
    if (previousBaseUrl === undefined) delete process.env.AI_BASE_URL;
    else process.env.AI_BASE_URL = previousBaseUrl;
    if (previousModel === undefined) delete process.env.AI_MODEL;
    else process.env.AI_MODEL = previousModel;
    global.fetch = previousFetch;
  }
});

test('AI volunteer turns provider errors into a clear human-handoff error', async () => {
  const previousKey = process.env.AI_API_KEY;
  const previousFetch = global.fetch;
  process.env.AI_API_KEY = 'test-only-placeholder';
  global.fetch = async () => ({ ok: false, status: 503 });
  try {
    await assert.rejects(
      respondToAssistance('Please help me.'),
      (error) => error.statusCode === 502 && /human volunteer/.test(error.message),
    );
  } finally {
    if (previousKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = previousKey;
    global.fetch = previousFetch;
  }
});

test('AI volunteer reports an empty provider response as an escalation-ready error', async () => {
  const previousKey = process.env.AI_API_KEY;
  const previousFetch = global.fetch;
  process.env.AI_API_KEY = 'test-only-placeholder';
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: '  ' } }] }),
  });
  try {
    await assert.rejects(
      respondToAssistance('Please help me.'),
      (error) => error.statusCode === 502 && /human volunteer/.test(error.message),
    );
  } finally {
    if (previousKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = previousKey;
    global.fetch = previousFetch;
  }
});
