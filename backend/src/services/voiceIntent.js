const rules = [
  { intent: 'STOP_NAVIGATION', pattern: /\b(detener|parar|cancelar)\s+(?:la\s+)?(?:navegación|alertas de ubicación)\b/i },
  { intent: 'STOP', pattern: /\b(detener|para de escuchar|dejar de escuchar)\b/i },
  { intent: 'ADMIN_DASHBOARD', pattern: /\b(?:administrador|moderador)(?:\s+(?:panel|tablero))?\b/i },
  { intent: 'SCENE_DESCRIPTION', pattern: /\b(?:describe|descripción|entorno|alrededor de mí|qué ves|qué hay delante de mí|escena)\b/i },
  { intent: 'BILL_READER', pattern: /\b(?:leer|revisar|identificar)?\s*(?:esta\s+|mi\s+)?(?:factura|billete|dinero|moneda|recibo)\b/i },
  { intent: 'DOCUMENT_READER', pattern: /\b(?:lee|leer|escanea?r?)\s+(?:el\s+|un\s+|mi\s+)?(?:documento|página|carta|libro|texto|letrero)\b/i },
  { intent: 'OBSTACLE_DETECTION', pattern: /\b(?:obstáculo|obstáculos|detecta|revisa el camino|qué hay en mi camino)\b/i },
  { intent: 'VOLUNTEER_REQUEST', pattern: /\b(?:voluntario|voluntarios|busca ayuda|solicita ayuda|necesito ayuda de una persona|habla con alguien)\b/i },
  { intent: 'REPORT_HAZARD', pattern: /\b(?:informar|reportar|informa|reporta).*\b(?:riesgo|peligro|bache|acera)\b|\b(?:bache|acera bloqueada)\b/i },
  { intent: 'CURRENT_LOCATION', pattern: /\b(?:dónde estoy|mi ubicación|ubicación actual|dime dónde estoy)\b/i },
  { intent: 'SOS', pattern: /\b(?:sos|emergencia|ayúdame ahora|ayuda de emergencia)\b/i },
  { intent: 'HAZARD_MAP', pattern: /\b(?:mapa|riesgos cercanos|peligros cercanos|mostrar riesgos)\b/i },
  { intent: 'TRUSTED_CONTACTS', pattern: /\bcontactos?\s+(?:de confianza|de emergencia)\b|\bmis contactos\b/i },
  { intent: 'NOTIFICATIONS', pattern: /\b(?:notificaciones|mis alertas|mostrar alertas)\b/i },
  { intent: 'SETTINGS', pattern: /\b(?:ajustes|configuración|preferencias|accesibilidad)\b/i },
  { intent: 'DASHBOARD', pattern: /\b(?:inicio|panel|volver al inicio|página principal)\b/i },
  { intent: 'KNOWLEDGE_LOOKUP', pattern: /^(?:dime sobre|qué es|quién es|explícame|define)\s+.+/i },
  { intent: 'STOP_NAVIGATION', pattern: /\b(stop|end|cancel|turn off)\s+(?:the\s+)?(?:navigation|location alerts)\b/i },
  { intent: 'STOP', pattern: /\b(stop|deactivate|sleep|stop listening)\b|ఆపు|ఆపండి|बंद करें|रोकें/i },
  { intent: 'ADMIN_DASHBOARD', pattern: /\b(?:admin(?:istrator)?|moderator)(?:\s+(?:dashboard|panel|workspace))?\b/i },
  { intent: 'SCENE_DESCRIPTION', pattern: /\b(describe|description|surroundings|around me|what do you see|what is in front of me|read the scene)\b|పరిసరాలు|చుట్టూ|వివరించు|आसपास|बताइए|दिख रहा/i },
  { intent: 'BILL_READER', pattern: /\b(read|check|identify)?\s*(?:(?:this|a|the|my)\s+)?(bill|currency|money|banknote|invoice|receipt)\b|డబ్బు|నోటు|బిల్లు|पैसे|नोट|बिल|रुपये/i },
  { intent: 'DOCUMENT_READER', pattern: /\bread\s+(?:(?:a|the|this|my)\s+)?(?:document|page|letter|book|text|sign)\b|\b(scan|document|read this aloud|this aloud)\b|చదవు|చదవండి|పత్రం|చదువు|पढ़ें|पढ़ो|दस्तावेज़/i },
  { intent: 'OBSTACLE_DETECTION', pattern: /\b(obstacle|obstacles|detect|check the path|what is in my way)\b|అడ్డంకి|అడ్డంకులను|बाधा|रुकावट/i },
  { intent: 'VOLUNTEER_REQUEST', pattern: /\b(volunteers?|human help|someone to help|find help|request help|talk to someone|connect me (?:with|to) (?:a volunteer|a person|someone|a human))\b|వాలంటీర్|సహాయం|मदद|स्वयंसेवक/i },
  { intent: 'REPORT_HAZARD', pattern: /\b(report|hazard|pothole|blocked sidewalk|report a problem)\b|ప్రమాదం|గుంత|నివేదించు|खतरा|गड्ढा|रिपोर्ट/i },
  { intent: 'CURRENT_LOCATION', pattern: /\b(where am i|my location|current location|tell me where i am)\b|ఎక్కడ|నా స్థానం|कहाँ हूँ|मेरी जगह/i },
  { intent: 'SOS', pattern: /\b(emergency support)\b/i },
  { intent: 'SOS', pattern: /\b(sos|emergency|help me now)\b|అత్యవసర|సహాయం చేయండి|आपातकाल|मदद करें/i },
  { intent: 'HAZARD_MAP', pattern: /\b(map|nearby hazards|nearby reports|show hazards)\b|మ్యాప్|ప్రమాదాల మ్యాప్|नक्शा|खतरे/i },
  { intent: 'TRUSTED_CONTACTS', pattern: /\b(trusted contacts|emergency contacts|my contacts)\b|విశ్వసనీయ పరిచయాలు|आपातकालीन संपर्क/i },
  { intent: 'NOTIFICATIONS', pattern: /\b(notifications|my alerts|show alerts)\b|నోటిఫికేషన్లు|सूचनाएं/i },
  { intent: 'SETTINGS', pattern: /\b(settings|preferences|accessibility settings)\b|సెట్టింగులు|సెట్టింగ్స్|सेटिंग्स/i },
  { intent: 'DASHBOARD', pattern: /\b(home|dashboard|go back home|main page)\b|హోమ్|ప్రధాన పేజీ|होम|मुख्य पृष्ठ/i },
  { intent: 'KNOWLEDGE_LOOKUP', pattern: /\b(?:open|go to|show|launch)\s+(?:the\s+)?(?:knowledge|learning|reference)(?:\s+(?:library|page|section))?\b/i },
  { intent: 'KNOWLEDGE_LOOKUP', pattern: /^(?:please\s+)?(?:(?:can|could)\s+you\s+)?(?:tell me about|what is|who is|explain|define|identify|give me facts about|information about|learn about)\s+.+/i },
];

const commandWords = [
  'volunteer', 'volunteers', 'document', 'documents', 'obstacle', 'obstacles',
  'surroundings', 'describe', 'description', 'currency', 'invoice', 'receipt',
  'hazard', 'hazards', 'pothole', 'location', 'notifications', 'settings',
  'contacts', 'navigation', 'navigate', 'directions', 'dashboard', 'detect',
  'report', 'scan', 'knowledge', 'camera', 'library', 'map', 'emergency',
  'voluntier', 'volenteer', 'documant', 'docoment', 'suroundings',
  'surrondings', 'describ', 'discribe', 'naviget', 'hazerd', 'libary',
  'obstical', 'obsticals', 'obsticle', 'obsticles',
];
const commandWordAliases = {
  voluntier: 'volunteer',
  volenteer: 'volunteer',
  documant: 'document',
  docoment: 'document',
  obstical: 'obstacle',
  obsticals: 'obstacles',
  obsticle: 'obstacle',
  obsticles: 'obstacles',
  suroundings: 'surroundings',
  surrondings: 'surroundings',
  describ: 'describe',
  discribe: 'describe',
  naviget: 'navigate',
  hazerd: 'hazard',
  libary: 'library',
};

function editDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const above = previous[column];
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[right.length];
}

function correctCommandWords(phrase) {
  return phrase.replace(/\b[a-z]+\b/gi, (word) => {
    const lower = word.toLowerCase();
    if (lower.length < 6) return word;
    const maxDistance = lower.length > 8 ? 2 : 1;
    let closest;
    let closestDistance = maxDistance + 1;
    for (const commandWord of commandWords) {
      if (Math.abs(commandWord.length - lower.length) > maxDistance) continue;
      const distance = editDistance(lower, commandWord);
      if (distance < closestDistance) {
        closest = commandWord;
        closestDistance = distance;
      }
    }
    if (!closest || closestDistance > maxDistance) return word;
    const corrected = commandWordAliases[closest] || closest;
    return word[0] === word[0].toUpperCase()
      ? corrected[0].toUpperCase() + corrected.slice(1)
      : corrected;
  });
}

function parseVoiceIntent(phrase = '') {
  const correctedPhrase = phrase
    .replace(/^(\s*(?:hey\s+)?)(?:mala|baila|baala|balah|bye)\b/i, '$1BALA')
    .replace(/^((?:\s*hey\s+)?BALA[\s,.:;-]+)(?:(?:please|can you|could you|would you|will you)\s+)+/i, '$1')
    .replace(/^\s*(?:(?:please|can you|could you|would you|will you)\s+)+/i, '')
    .replace(/^(\s*(?:(?:hey\s+)?bala[\s,.:;-]+)?)(?:red|reed)\s+(?:(?:a|the|this|my)\s+)?(document|page|letter|book|text|sign)\b/i, '$1read a $2')
    .replace(/\bread\s+(?:(?:a|the|this|my)\s+)?(?:red|reed)\s+(document|page|letter|book|text|sign)\b/i, 'read a $1')
    .replace(/\b(read|reed|red)\s+(?:it|this|that)\s+(?:out\s+)?(?:loud|aloud)\b/i, 'read this aloud')
    .replace(/\bwhat(?:'s| is)\s+(?:around|all around)\s+me\b/i, 'describe my surroundings')
    .replace(/\bwhat(?:'s| is)\s+in\s+front\s+of\s+me\b/i, 'describe my surroundings')
    .replace(/\bwhat(?:'s| is)\s+in\s+my\s+(?:way|path)\b/i, 'check the path for obstacles');
  const normalized = correctCommandWords(correctedPhrase).trim().replace(/^(bala|బాలా|బాల|बाला)[\s,.:;-]*/i, '');
  const wakeWord = /\b(?:bala|mala|baila|baala|balah|bye)\b|బాలా|బాల|बाला/i.test(phrase);
  if (!normalized) return { activated: wakeWord, intent: null };
  const pageOverrides = [
    { intent: 'DOCUMENT_READER', pattern: /\b(?:read|reed|red)\s+(?:it|this|that)\s+(?:out\s+)?(?:loud|aloud)\b|\b(?:read this aloud|read it aloud|read this to me)\b/i },
    { intent: 'SCENE_DESCRIPTION', pattern: /\b(?:what(?:'s| is) around me|what do you see|show me what (?:you|the camera) see|what does (?:my )?camera see|describe what is in front of me)\b/i },
    { intent: 'OBSTACLE_DETECTION', pattern: /\b(?:is (?:the )?path clear|check (?:the )?(?:path|way) for obstacles|what is in my (?:way|path))\b/i },
    { intent: 'VOLUNTEER_REQUEST', pattern: /\b(?:speak|talk) to a real person\b/i },
    { intent: 'HAZARD_MAP', pattern: /\bshow me the (?:hazard )?map\b/i },
    { intent: 'REPORT_HAZARD', pattern: /\b(?:there(?:'s| is) a pothole|the sidewalk is blocked|report this problem)\b/i },
    { intent: 'START_NAVIGATION', pattern: /\b(?:take|guide|lead) me to\b|\bdirections to\b|\broute to\b/i },
    { intent: 'CURRENT_LOCATION', pattern: /\bwhere am i\b|\bwhat is my location\b/i },
    { intent: 'STOP_NAVIGATION', pattern: /\b(detener|parar|cancelar)\s+(?:la\s+)?(?:navegación|alertas de ubicación)\b/i },
    { intent: 'HELP', pattern: /^(?:ayuda|qué puedes hacer|comandos de voz)[?.!]*$/i },
    { intent: 'CALL_CONTACT', pattern: /\b(?:llama|llamar|telefonear)\b.*\b(?:contacto|contactos|mamá|madre|papá|padre|familia|amigo|emergencia)\b/i },
    { intent: 'START_NAVIGATION', pattern: /\b(?:iniciar|comenzar|empezar)\s+(?:la\s+)?navegación\b|\bnavega(?:r)?\s+(?:hasta|a)\b/i },
    { intent: 'TRUSTED_CONTACTS', pattern: /\bcontactos?\s+(?:de confianza|de emergencia)\b|\bmis contactos\b/i },
    { intent: 'HAZARD_MAP', pattern: /\b(?:mapa|riesgos cercanos|peligros cercanos|mostrar riesgos)\b/i },
    { intent: 'SCENE_DESCRIPTION', pattern: /\bescena(?:\s+visual)?\b/i },
    { intent: 'NAVIGATION', pattern: /\b(?:navegación|alertas de navegación|alertas de ruta|avisos cercanos)\b/i },
    { intent: 'CURRENT_LOCATION', pattern: /\b(?:abre|ir a|mostrar|llévame a)\b.*\b(?:mi ubicación|ubicación actual)\b/i },
    { intent: 'STOP_NAVIGATION', pattern: /\b(stop|end|cancel|turn off)\s+(?:the\s+)?(?:navigation|location alerts)\b/i },
    { intent: 'HELP', pattern: /^(?:please\s+)?(?:help|what can you do|voice commands|command list)[?.!]*$/i },
    { intent: 'ADMIN_DASHBOARD', pattern: /\b(?:admin(?:istrator)?|moderator)(?:\s+(?:dashboard|panel|workspace))?\b/i },
    { intent: 'CALL_CONTACT', pattern: /\b(call|phone|dial)\b.*\b(contact|contacts|mom|mother|dad|father|parent|family|friend|trusted person|emergency contact)\b/i },
    { intent: 'START_NAVIGATION', pattern: /\b(start|begin|launch)\s+(?:the\s+)?navigation\b|\bnavigate(?: me)?\b/i },
    { intent: 'TRUSTED_CONTACTS', pattern: /\b(?:trusted|emergency)?\s*contacts?\b/i },
    { intent: 'HAZARD_MAP', pattern: /\b(map|nearby hazards|nearby reports|show hazards|hazard map)\b/i },
    { intent: 'SCENE_DESCRIPTION', pattern: /\bscene(?: description)?\b/i },
    { intent: 'NAVIGATION', pattern: /\b(navigation|navigation alerts|route alerts|nearby alerts)\b/i },
    { intent: 'CURRENT_LOCATION', pattern: /\b(?:open|go to|show|launch|take me to)\b.*\bmy location\b/i },
    { intent: 'NAVIGATION', pattern: /\b(?:open|go to|show|launch|take me to)\b.*\bnavigation(?: alerts)?\b/i },
  ];
  const match = pageOverrides.find((rule) => rule.pattern.test(normalized))
    || rules.find((rule) => rule.pattern.test(normalized));
  const destinationRequest = /\b(?:directions?|route)\s+to\s+.+|\b(?:take|guide|lead)\s+me\s+to\s+.+|\b(?:go|walk|drive)\s+to\s+.+|\b(?:llévame|guíame|cómo llegar)\s+(?:a|hasta)\s+.+/i.test(normalized);
  if (!match && destinationRequest) return { activated: wakeWord, intent: 'START_NAVIGATION' };
  return { activated: wakeWord, intent: match?.intent || (wakeWord ? 'UNKNOWN' : null) };
}

module.exports = { parseVoiceIntent };
