const ApiError = require('../utils/ApiError');
const { LANGUAGE_NAMES } = require('../constants/languages');

async function describeImage(imageData, task, language = 'en') {
  if (!process.env.AI_API_KEY) {
    throw new ApiError(503, 'Your photo is selected and previewed, but it has not been analyzed: this server has no AI_API_KEY configured. Add your provider key to backend/.env, restart the backend, then choose Ask BALA again. Never put the key in the frontend or share it in chat.');
  }
  if (typeof imageData !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(imageData)) {
    throw new ApiError(400, 'Please provide a JPEG, PNG, or WebP image.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
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
        temperature: 0.2,
        max_tokens: 250,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: `${task} Answer concisely for a visually impaired person, in language code "${language}" (${LANGUAGE_NAMES[language] || 'English'}). State uncertainty; never claim a scene or safety prediction is certain, and never invent financial amounts.` },
            { type: 'image_url', image_url: { url: imageData, detail: 'high' } },
          ],
        }],
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error(`AI image provider returned HTTP ${response.status}.`);
      if (response.status === 401) throw new ApiError(503, 'OpenAI rejected the API key. Check that AI_API_KEY in backend/.env is current, has no surrounding quotes or spaces, and then restart the backend.');
      if (response.status === 403) throw new ApiError(503, 'This OpenAI key or project does not have permission to use the configured image model. Check project access and API organization settings.');
      if (response.status === 429 && result.error?.code === 'insufficient_quota') {
        throw new ApiError(503, 'The OpenAI API key was accepted, but this project has no available API quota. Enable API billing or increase the project usage limit, then try again.');
      }
      if (response.status === 429) throw new ApiError(503, 'OpenAI is rate-limiting requests. Wait a moment and try again.');
      if (response.status === 404) throw new ApiError(503, 'The configured OpenAI model was not found. Check AI_MODEL in backend/.env; gpt-4o-mini supports image input.');
      if (response.status === 400) throw new ApiError(502, 'OpenAI rejected the image request. Check the configured model and try a different, clear JPEG photo.');
      throw new ApiError(502, 'The AI service could not process this image. Please try again.');
    }
    const text = result.choices?.[0]?.message?.content?.trim();
    if (!text) throw new ApiError(502, 'The AI service returned no description. Please try again.');
    return { text, uncertain: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') throw new ApiError(504, 'Image analysis took too long. Please retry with a smaller image.');
    throw new ApiError(502, 'The AI service is temporarily unavailable. Please try again.');
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { describeImage };
