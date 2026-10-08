const ApiError = require('../utils/ApiError');
const { LANGUAGE_NAMES } = require('../constants/languages');

async function respondToAssistance(message, language = 'en') {
  if (!process.env.AI_API_KEY) {
    throw new ApiError(503, 'The AI volunteer is unavailable. Your request can be sent to a human volunteer.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 58_000);
  try {
    const response = await fetch(`${(process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content: `You are BALA's AI accessibility helper, not a human volunteer. Reply in language code "${language}" (${LANGUAGE_NAMES[language] || 'English'}). Be kind, concise, and easy to understand aloud. Address the user's specific request when possible. If the user needs a live person, say clearly that you are an AI and cannot join a call, and that BALA can connect them to a human volunteer. Never claim to have contacted anyone, taken an action, inspected surroundings, or guaranteed safety. For emergencies, tell them to contact local emergency services or a trusted person.`,
          },
          { role: 'user', content: message },
        ],
      }),
    });
    if (!response.ok) {
      console.error('AI volunteer provider rejected a request:', response.status);
      throw new ApiError(502, 'The AI volunteer could not respond. Your request can be sent to a human volunteer.');
    }
    const result = await response.json();
    const reply = result.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new ApiError(502, 'The AI volunteer returned no reply. Your request can be sent to a human volunteer.');
    return { reply: reply.slice(0, 1200) };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') throw new ApiError(504, 'The AI volunteer did not respond within 60 seconds. Your request can be sent to a human volunteer.');
    throw new ApiError(502, 'The AI volunteer is temporarily unavailable. Your request can be sent to a human volunteer.');
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { respondToAssistance };
