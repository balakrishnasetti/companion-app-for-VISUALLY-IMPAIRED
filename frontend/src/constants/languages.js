export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', locale: 'en-US', whisper: 'english', tesseract: 'eng' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', locale: 'te-IN', whisper: 'telugu', tesseract: 'tel' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', locale: 'hi-IN', whisper: 'hindi', tesseract: 'hin' },
  { code: 'es', label: 'Spanish', native: 'Español', locale: 'es-ES', whisper: 'spanish', tesseract: 'spa' },
];

export const LANGUAGE_CODES = LANGUAGES.map(({ code }) => code);
export const LANGUAGE_BY_CODE = Object.fromEntries(LANGUAGES.map((language) => [language.code, language]));
