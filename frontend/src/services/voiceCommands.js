const COMMAND_WORDS = [
  'volunteer', 'volunteers', 'document', 'documents', 'obstacle', 'obstacles',
  'surroundings', 'describe', 'description', 'currency', 'invoice', 'receipt',
  'hazard', 'hazards', 'pothole', 'location', 'notifications', 'settings',
  'contacts', 'navigation', 'navigate', 'directions', 'dashboard', 'detect',
  'report', 'scan', 'knowledge', 'camera', 'library', 'map', 'emergency',
  'voluntier', 'volenteer', 'documant', 'docoment', 'suroundings',
  'surrondings', 'describ', 'discribe', 'naviget', 'hazerd', 'libary',
  'administrator', 'moderator',
  'obstical', 'obsticals', 'obsticle', 'obsticles',
  'hazzard', 'hazerds', 'navigashion', 'navigashun', 'surrounding',
  'surounding', 'surronding', 'camra', 'cammera', 'pothol',
  'walanteal',
];
const COMMAND_WORD_ALIASES = {
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
  hazzard: 'hazard',
  hazerds: 'hazards',
  navigashion: 'navigation',
  navigashun: 'navigation',
  surounding: 'surroundings',
  surronding: 'surroundings',
  surrounding: 'surroundings',
  camra: 'camera',
  cammera: 'camera',
  pothol: 'pothole',
  walanteal: 'volunteer',
  libary: 'library',
};
const WAKE_WORD_PREFIX = /^(?:hey\s+)?(?:bala|mala|baila|baala|balah|bye|బాలా|బాల|बाला)[\s,.:;-]*/i;
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
    const directCorrection = COMMAND_WORD_ALIASES[lower];
    if (directCorrection) {
      return word[0] === word[0].toUpperCase()
        ? directCorrection[0].toUpperCase() + directCorrection.slice(1)
        : directCorrection;
    }
    if (lower.length < 6) return word;
    const maxDistance = lower.length > 8 ? 2 : 1;
    let closest;
    let closestDistance = maxDistance + 1;
    for (const commandWord of COMMAND_WORDS) {
      if (Math.abs(commandWord.length - lower.length) > maxDistance) continue;
      const distance = editDistance(lower, commandWord);
      if (distance < closestDistance) {
        closest = commandWord;
        closestDistance = distance;
      }
    }
    if (!closest || closestDistance > maxDistance) return word;
    const corrected = COMMAND_WORD_ALIASES[closest] || closest;
    return word[0] === word[0].toUpperCase()
      ? corrected[0].toUpperCase() + corrected.slice(1)
      : corrected;
  });
}

export function normalizeVoiceCommand(phrase) {
  const normalized = phrase
    .replace(/^(\s*(?:hey\s+)?)(?:mala|baila|baala|balah|waala|walla|bye)\b/i, '$1BALA')
    .replace(/^\s*(?:hey\s+)?(?:బాలా|బాల|बाला)[\s,.:;-]*/i, 'BALA ')
    .replace(/^((?:hey\s+)?BALA[\s,.:;-]+)(?:(?:please|can you|could you|would you|will you)\s+)+/i, '$1')
    .replace(/^(?:(?:please|can you|could you|would you|will you)\s+)+/i, '')
    .replace(/^(\s*(?:(?:hey\s+)?bala[\s,.:;-]+)?)(?:red|reed)\s+(?:(?:a|the|this|my)\s+)?(document|page|letter|book|text|sign)\b/i, '$1read a $2')
    .replace(/\bread\s+(?:(?:a|the|this|my)\s+)?(?:red|reed)\s+(document|page|letter|book|text|sign)\b/i, 'read a $1')
    .replace(/\b(read|reed|red)\s+(?:it|this|that)\s+(?:out\s+)?(?:loud|aloud)\b/i, 'read this aloud')
    .replace(/\bwhat(?:'s| is)\s+(?:around|all around)\s+me\b/i, 'describe my surroundings')
    .replace(/\bwhat(?:'s| is)\s+in\s+front\s+of\s+me\b/i, 'describe my surroundings')
    .replace(/\bwhat(?:'s| is)\s+in\s+my\s+(?:way|path)\b/i, 'check the path for obstacles')
    .replace(/\b(?:show|tell)\s+me\s+(?:what|everything)\s+(?:you|the camera)\s+(?:can\s+)?see\b/i, 'describe my surroundings')
    .replace(/\b(?:describe|explain)\s+(?:the\s+)?(?:scene|area|place)\b/i, 'describe my surroundings')
    .replace(/\b(?:check|look)\s+for\s+obstacles?\s+(?:ahead|in front of me|on the path|in my path)\b/i, 'check the path for obstacles')
    .replace(/\b(?:read|reed|red)\s+(?:this|the|my)\s+(?:page|letter|book|sign|text)\s+(?:to me|for me|out loud|aloud)\b/i, 'read this document')
    .replace(/\b(?:share|update|find)\s+(?:my\s+)?(?:current\s+)?location\b/i, 'where am i')
    .replace(/\bnavigation\s+to\b/i, 'navigate to')
    .replace(/\b(?:show|open)\s+(?:the\s+)?(?:nearby\s+)?hazard map\b/i, 'show me the hazard map')
    .replace(/\b(?:report|record|log)\s+(?:this\s+|a\s+|the\s+)?(?:pothole|hazard|blocked sidewalk|obstacle)\b/i, 'report this problem')
    .replace(/\s+/g, ' ')
    .trim();
  const corrected = correctCommandWords(normalized)
    .replace(/\bnavigation\s+to\b/i, 'navigate to')
    .replace(/^(?:hey\s+)?BALA[,\s]+(?:fine\s+day|find\s+day|find\s+the)[,\s]+volunteer\b.*$/i, 'BALA find a volunteer');
  return corrected;
}

export const VOICE_INTENT_PATHS = {
  SCENE_DESCRIPTION: '/app/scene',
  OBSTACLE_DETECTION: '/app/obstacles',
  DOCUMENT_READER: '/app/document',
  BILL_READER: '/app/currency',
  VOLUNTEER_REQUEST: '/app/volunteers',
  REPORT_HAZARD: '/app/hazards',
  CURRENT_LOCATION: '/app/navigation',
  START_NAVIGATION: '/app/navigation',
  NAVIGATION: '/app/navigation',
  STOP_NAVIGATION: '/app/navigation',
  HAZARD_MAP: '/app/map',
  SOS: '/app/sos',
  DASHBOARD: '/app',
  CALL_CONTACT: '/app/contacts',
  TRUSTED_CONTACTS: '/app/contacts',
  NOTIFICATIONS: '/app/notifications',
  SETTINGS: '/app/settings',
  KNOWLEDGE_LOOKUP: '/app/learn',
  ADMIN_DASHBOARD: '/app/admin',
};

export function findVoiceIntent(phrase) {
  const command = phrase.replace(WAKE_WORD_PREFIX, '').trim();
  const rules = [
    ['DOCUMENT_READER', /\b(?:read|reed|red)\s+(?:it|this|that)\s+(?:out\s+)?(?:loud|aloud)\b|\b(?:read this aloud|read it aloud|read this to me)\b/i],
    ['SCENE_DESCRIPTION', /\b(?:what(?:'s| is) around me|what do you see|show me what (?:you|the camera) see|what does (?:my )?camera see|describe what is in front of me|describe my surroundings|describe (?:the )?(?:scene|area|place)|what am i looking at|tell me what you see)\b/i],
    ['OBSTACLE_DETECTION', /\b(?:is (?:the )?path clear|check (?:the )?(?:path|way) for obstacles|what is in my (?:way|path)|check for obstacles|are there obstacles|any obstacles ahead)\b/i],
    ['VOLUNTEER_REQUEST', /\b(?:speak|talk) to a real person\b/i],
    ['HAZARD_MAP', /\bshow me the (?:hazard )?map\b/i],
    ['REPORT_HAZARD', /\b(?:there(?:'s| is) a pothole|the sidewalk is blocked|report this problem|report (?:a|the|this) (?:pothole|hazard|blocked sidewalk|obstacle))\b/i],
    ['START_NAVIGATION', /\b(?:take|guide|lead) me to\b|\bnavigate(?: me)? to\b|\bdirections to\b|\broute to\b/i],
    ['CURRENT_LOCATION', /\bwhere am i\b|\bwhat is my location\b|\b(?:share|update|find) (?:my )?(?:current )?location\b/i],
    ['STOP_NAVIGATION', /\b(detener|parar|cancelar)\s+(?:la\s+)?(?:navegación|alertas de ubicación)\b/i],
    ['STOP', /\b(detener|para de escuchar|dejar de escuchar)\b/i],
    ['HELP', /^(?:ayuda|qué puedes hacer|comandos de voz)[?.!]*$/i],
    ['ADMIN_DASHBOARD', /\b(?:administrador|moderador)(?:\s+(?:panel|tablero))?\b/i],
    ['CALL_CONTACT', /\b(?:llama|llamar|telefonear)\b.*\b(?:contacto|contactos|mamá|madre|papá|padre|familia|amigo|emergencia)\b/i],
    ['START_NAVIGATION', /\b(?:iniciar|comenzar|empezar)\s+(?:la\s+)?navegación\b|\bnavega(?:r)?\s+(?:hasta|a)\b/i],
    ['TRUSTED_CONTACTS', /\bcontactos?\s+(?:de confianza|de emergencia)\b|\bmis contactos\b/i],
    ['SOS', /\b(?:sos|emergencia|ayúdame ahora|ayuda de emergencia)\b/i],
    ['BILL_READER', /\b(?:leer|revisar|identificar)?\s*(?:esta\s+|mi\s+)?(?:factura|billete|dinero|moneda|recibo)\b/i],
    ['DOCUMENT_READER', /\b(?:lee|leer|escanea?r?)\s+(?:el\s+|un\s+|mi\s+)?(?:documento|página|carta|libro|texto|letrero)\b/i],
    ['SCENE_DESCRIPTION', /\b(?:describe|descripción|entorno|alrededor de mí|qué ves|qué hay delante de mí|escena)\b/i],
    ['OBSTACLE_DETECTION', /\b(?:obstáculo|obstáculos|detecta|revisa el camino|qué hay en mi camino)\b/i],
    ['VOLUNTEER_REQUEST', /\b(?:voluntario|voluntarios|busca ayuda|solicita ayuda|necesito ayuda de una persona|habla con alguien)\b/i],
    ['HAZARD_MAP', /\b(?:mapa|riesgos cercanos|peligros cercanos|mostrar riesgos)\b/i],
    ['REPORT_HAZARD', /\b(?:informar|reportar|informa|reporta).*\b(?:riesgo|peligro|bache|acera)\b|\b(?:bache|acera bloqueada)\b/i],
    ['CURRENT_LOCATION', /\b(?:dónde estoy|mi ubicación|ubicación actual|dime dónde estoy)\b/i],
    ['NAVIGATION', /\b(?:navegación|alertas de navegación|alertas de ruta|avisos cercanos)\b/i],
    ['NOTIFICATIONS', /\b(?:notificaciones|mis alertas|mostrar alertas)\b/i],
    ['SETTINGS', /\b(?:ajustes|configuración|preferencias|accesibilidad)\b/i],
    ['DASHBOARD', /\b(?:inicio|panel|volver al inicio|página principal)\b/i],
    ['KNOWLEDGE_LOOKUP', /^(?:dime sobre|qué es|quién es|explícame|define)\s+.+/i],
    ['STOP_NAVIGATION', /\b(stop|end|cancel|turn off)\s+(?:the\s+)?(?:navigation|location alerts)\b/i],
    ['STOP', /\b(stop|deactivate|sleep|stop listening)\b|ఆపు|ఆపండి|बंद करें|रोकें/i],
    ['HELP', /^(?:please\s+)?(?:help|what can you do|voice commands|command list)[?.!]*$/i],
    ['ADMIN_DASHBOARD', /\b(?:admin(?:istrator)?|moderator)(?:\s+(?:dashboard|panel|workspace))?\b/i],
    ['CALL_CONTACT', /\b(call|phone|dial)\b.*\b(contact|contacts|mom|mother|dad|father|parent|family|friend|trusted person|emergency contact)\b/i],
    ['START_NAVIGATION', /\b(start|begin|launch)\s+(?:the\s+)?navigation\b|\bnavigate(?: me)?\b/i],
    ['TRUSTED_CONTACTS', /\b(?:trusted|emergency)?\s*contacts?\b|విశ్వసనీయ పరిచయాలు|आपातकालीन संपर्क/i],
    ['SOS', /\b(sos|emergency assistance|emergency help|emergency support|help me now)\b|అత్యవసర సహాయం|సహాయం చేయండి|आपातकालीन सहायता|मदद करें/i],
    ['BILL_READER', /\b(read|check|identify)?\s*(?:(?:this|a|the|my)\s+)?(bill|currency|money|banknote|invoice|receipt)\b|డబ్బు|నోటు|బిల్లు|पैसे|नोट|बिल|रुपये/i],
    ['DOCUMENT_READER', /\bread\s+(?:(?:a|the|this|my)\s+)?(?:document|page|letter|book|text|sign)\b|\b(scan|document|read this aloud|this aloud)\b|చదవు|చదవండి|పత్రం|చదువు|पढ़ें|पढ़ो|दस्तావेज़/i],
    ['SCENE_DESCRIPTION', /\b(describe|description|surroundings|around me|what do you see|what is in front of me|read the scene|scene(?: description)?|visual description)\b|పరిసరాలు|చుట్టూ|వివరించు|आसपास|बताइए|दिख रहा/i],
    ['OBSTACLE_DETECTION', /\b(obstacle|obstacles|detect|check the path|what is in my way)\b|అడ్డంకి|అడ్డంకులను|बाधा|रुकावट/i],
    ['VOLUNTEER_REQUEST', /\b(volunteers?|human help|someone to help|find help|request help|talk to someone|connect me with help|connect me (?:with|to) (?:a volunteer|a person|someone|a human))\b|వాలంటీర్|సహాయం|मदद|स्वयंसेवक/i],
    ['HAZARD_MAP', /\b(map|nearby hazards|nearby reports|show hazards|hazard map)\b|మ్యాప్|ప్రమాదాల మ్యాప్|नक्शा|खतरे/i],
    ['REPORT_HAZARD', /\b(report(?:ing)?(?:\s+(?:a|this|the))?\s+hazard|hazard report(?:ing)?|pothole|blocked sidewalk|report a problem)\b|ప్రమాదం|గుంత|నివేదించు|खतरा|गड्ढा|रिपोर्ट/i],
    ['CURRENT_LOCATION', /\b(where am i|my location|current location|tell me where i am|open my location)\b|ఎక్కడ|నా స్థానం|कहाँ हूँ|मेरी जगह/i],
    ['NAVIGATION', /\b(navigation|navigation alerts|route alerts|nearby alerts)\b|నావిగేషన్|मार्ग चेतावनी/i],
    ['NOTIFICATIONS', /\b(notifications|my alerts|show alerts)\b|నోటిఫికేషన్లు|सूचनाएं/i],
    ['SETTINGS', /\b(settings|preferences|accessibility settings)\b|సెట్టింగులు|సెట్టింగ్స్|सेटिंग्स/i],
    ['DASHBOARD', /\b(home|dashboard|go back home|main page)\b|హోమ్|ప్రధాన పేజీ|होम|मुख्य पृष्ठ/i],
    ['KNOWLEDGE_LOOKUP', /\b(?:open|go to|show|launch)\s+(?:the\s+)?(?:knowledge|learning|reference)(?:\s+(?:library|page|section))?\b/i],
    ['KNOWLEDGE_LOOKUP', /^(?:please\s+)?(?:(?:can|could)\s+you\s+)?(?:tell me about|what is|who is|explain|define|identify|give me facts about|information about|learn about)\s+.+/i],
  ];
  const match = rules.find(([, pattern]) => pattern.test(command))?.[0];
  if (match) return match;
  if (/\b(?:directions?|route)\s+to\s+.+|\b(?:take|guide|lead)\s+me\s+to\s+.+|\b(?:go|walk|drive)\s+to\s+.+|\b(?:llévame|guíame|cómo llegar)\s+(?:a|hasta)\s+.+/i.test(command)) return 'START_NAVIGATION';
  const openPage = /\b(open|go to|show|launch|take me to)\b/i.test(command);
  if (openPage && /\b(document|page|letter|book|text|sign)\b/i.test(command)) return 'DOCUMENT_READER';
  if (openPage && /\b(currency|money|bill|banknote|invoice|receipt)\b/i.test(command)) return 'BILL_READER';
  if (openPage && /\b(home|dashboard|main page)\b/i.test(command)) return 'DASHBOARD';
  return 'UNKNOWN';
}

export function isVolunteerConnectionRequest(phrase) {
  const command = phrase.replace(WAKE_WORD_PREFIX, '').trim();
  return /\b(?:request help|request assistance|request support)\b/i.test(command)
    || /\b(?:connect|talk|speak|chat|call|request|send|contact)\b.*\b(?:volunteers?|human help|a person|someone)\b/i.test(command)
    || /\b(?:volunteers?|human help|a person|someone)\b.*\b(?:connect|talk|speak|chat|call|request|send|contact)\b/i.test(command)
    || /\b(?:i need|i want|find me|get me|please get me)\b.*\b(?:volunteers?|human help|a person|someone to help)\b/i.test(command)
    || /వాలంటీర్.{0,24}(?:కావాలి|కనెక్ట్|మాట్లాడ|కలప)|(?:కనెక్ట్|మాట్లాడ|కలప).{0,24}వాలంటీర్|సహాయం.{0,12}కావాలి/i.test(command)
    || /स्वयंसेवक.{0,24}(?:चाहिए|मिलाइए|मिलाएं|जोड़ें|बात)|(?:मिलाइए|मिलाएं|जोड़ें|बात).{0,24}स्वयंसेवक|मदद.{0,12}चाहिए/i.test(command);
}

export function extractNavigationDestination(phrase) {
  const command = phrase
    .replace(WAKE_WORD_PREFIX, '')
    .trim();
  const match = command.match(/\b(?:start|begin|launch)\s+(?:the\s+)?navigation\s+(?:to|toward|towards)\s+(.+)$/i)
    || command.match(/\b(?:navigate(?:\s+me)?|take\s+me|guide\s+me|lead\s+me|directions?|route)\s+(?:to|toward|towards)\s+(.+)$/i)
    || command.match(/\b(?:get|show|give\s+me)\s+directions?\s+to\s+(.+)$/i)
    || command.match(/\b(?:go|walk|drive)\s+to\s+(.+)$/i);
  return match?.[1]
    ?.replace(/[.!?,;:]+$/, '')
    .replace(/^(?:the|a|an)\s+/i, '')
    .replace(/\s+(?:please|for me)$/i, '')
    .replace(/[.!?,;:]+$/, '')
    .trim() || '';
}

export function extractKnowledgeQuery(phrase) {
  return phrase
    .replace(WAKE_WORD_PREFIX, '')
    .replace(/^(?:please\s+)?(?:(?:can|could)\s+you\s+)?(?:tell me about|what is|who is|explain|define|identify|give me facts about|information about|learn about)\s+/i, '')
    .replace(/^(?:a|an|the)\s+/i, '')
    .replace(/[?.!,;:]+$/, '')
    .trim();
}
