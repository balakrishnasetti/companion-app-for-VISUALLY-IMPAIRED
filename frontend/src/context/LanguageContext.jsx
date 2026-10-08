import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import api from '../services/api.js';
import { LANGUAGE_BY_CODE, LANGUAGE_CODES } from '../constants/languages.js';

const messages = {
  en: {
    home: 'Home', dashboard: 'Dashboard', scene: 'Describe surroundings', obstacles: 'Detect obstacles',
    document: 'Read a document', currency: 'Read currency', volunteers: 'Find a volunteer', map: 'Hazard map',
    reportHazard: 'Report a hazard', navigation: 'Navigation alerts', knowledge: 'Learn about things', sos: 'SOS emergency', contacts: 'Trusted contacts', notifications: 'Notifications',
    settings: 'Accessibility settings', admin: 'Admin dashboard', signIn: 'Sign in', register: 'Create account',
    signOut: 'Sign out', listen: 'Talk to BALA', stop: 'Stop listening', online: 'Online', offline: 'Offline',
    title: 'A little more independence, every day.', subtitle: 'A calm, capable companion for reading, exploring and getting a helping hand when you need one.',
    welcome: 'Good to have you here', quickActions: 'What would you like help with?', greeting: 'Hello',
    sceneTitle: 'Describe surroundings', obstacleTitle: 'Detect obstacles', documentTitle: 'Read a document',
    currencyTitle: 'Read currency or a bill', volunteerTitle: 'Volunteer space', findVolunteerTitle: 'A helping hand, on the line', mapTitle: 'Community hazard map',
    hazardTitle: 'Report a hazard', navigationTitle: 'Navigation alerts', knowledgeTitle: 'Learn about things', sosTitle: 'SOS emergency',
    contactsTitle: 'Trusted contacts', notificationsTitle: 'Notifications', settingsTitle: 'Accessibility settings',
    adminTitle: 'System overview', backDashboard: 'Back to your space', chooseHelp: 'Choose a little help',
    sceneDetail: 'Ask what your camera sees', obstacleDetail: 'Cautious visual guidance',
    documentDetail: 'OCR in your preferred language', currencyDetail: 'Hear visible amounts',
    volunteerDetail: 'Talk to a verified person', mapDetail: 'Community-verified reports',
    reportDetail: 'Help your community', navigationDetail: 'Nearby hazard notices',
    sosDetail: 'Reach your people',
    knowledgeDetail: 'Animals, plants and resources',
  },
  te: {
    home: 'హోమ్', dashboard: 'డాష్‌బోర్డ్', scene: 'పరిసరాలను వివరించు', obstacles: 'అడ్డంకులను గుర్తించు',
    document: 'పత్రాన్ని చదువు', currency: 'డబ్బును చదువు', volunteers: 'వాలంటీర్‌ను కనుగొను', map: 'ప్రమాదాల మ్యాప్',
    reportHazard: 'ప్రమాదాన్ని నివేదించు', navigation: 'నావిగేషన్ హెచ్చరికలు', knowledge: 'విషయాల గురించి తెలుసుకోండి', sos: 'అత్యవసర SOS', contacts: 'నమ్మకమైన పరిచయాలు', notifications: 'నోటిఫికేషన్‌లు',
    settings: 'అందుబాటు సెట్టింగ్‌లు', admin: 'అడ్మిన్ డాష్‌బోర్డ్', signIn: 'లాగిన్', register: 'ఖాతా సృష్టించు',
    signOut: 'లాగ్ అవుట్', listen: 'BALAతో మాట్లాడండి', stop: 'వినడం ఆపండి', online: 'ఆన్‌లైన్', offline: 'ఆఫ్‌లైన్',
    title: 'ప్రతి రోజు కొంచెం ఎక్కువ స్వతంత్రత.', subtitle: 'చదవడానికి, పరిసరాలను తెలుసుకోవడానికి, అవసరమైనప్పుడు సహాయం పొందడానికి మీకు తోడుగా ఉండే సహాయకుడు.',
    welcome: 'మీరు రావడం సంతోషం', quickActions: 'మీకు ఏ సహాయం కావాలి?', greeting: 'నమస్కారం',
    sceneTitle: 'పరిసరాలను వివరించు', obstacleTitle: 'అడ్డంకులను గుర్తించు', documentTitle: 'పత్రాన్ని చదువు',
    currencyTitle: 'డబ్బు లేదా బిల్లును చదువు', volunteerTitle: 'వాలంటీర్ సహాయం', findVolunteerTitle: 'వాలంటీర్‌తో మాట్లాడండి', mapTitle: 'సమాజ ప్రమాదాల మ్యాప్',
    hazardTitle: 'ప్రమాదాన్ని నివేదించు', navigationTitle: 'నావిగేషన్ హెచ్చరికలు', knowledgeTitle: 'విషయాల గురించి తెలుసుకోండి', sosTitle: 'అత్యవసర SOS',
    contactsTitle: 'నమ్మకమైన పరిచయాలు', notificationsTitle: 'నోటిఫికేషన్‌లు', settingsTitle: 'అందుబాటు సెట్టింగ్‌లు',
    adminTitle: 'సిస్టమ్ అవలోకనం', backDashboard: 'మీ స్థలానికి తిరిగి వెళ్ళండి', chooseHelp: 'సహాయాన్ని ఎంచుకోండి',
    sceneDetail: 'కెమెరా ఏమి చూస్తుందో అడగండి', obstacleDetail: 'జాగ్రత్తతో దృశ్య మార్గదర్శకం',
    documentDetail: 'మీ భాషలో OCR', currencyDetail: 'కనిపించే మొత్తాలను వినండి',
    volunteerDetail: 'ధృవీకరించిన వ్యక్తితో మాట్లాడండి', mapDetail: 'సమాజం ధృవీకరించిన నివేదికలు',
    reportDetail: 'మీ సమాజానికి సహాయం చేయండి', navigationDetail: 'సమీప ప్రమాద హెచ్చరికలు',
    sosDetail: 'మీ వారికి చేరండి',
    knowledgeDetail: 'జంతువులు, మొక్కలు మరియు వనరులు',
  },
  hi: {
    home: 'होम', dashboard: 'डैशबोर्ड', scene: 'आसपास का वर्णन', obstacles: 'बाधाएँ पहचानें',
    document: 'दस्तावेज़ पढ़ें', currency: 'नोट पढ़ें', volunteers: 'स्वयंसेवक खोजें', map: 'खतरे का नक्शा',
    reportHazard: 'खतरे की सूचना दें', navigation: 'नेविगेशन अलर्ट', knowledge: 'चीज़ों के बारे में जानें', sos: 'आपातकालीन SOS', contacts: 'विश्वसनीय संपर्क', notifications: 'सूचनाएँ',
    settings: 'सुलभता सेटिंग', admin: 'एडमिन डैशबोर्ड', signIn: 'लॉग इन', register: 'खाता बनाएँ',
    signOut: 'लॉग आउट', listen: 'BALA से बात करें', stop: 'सुनना बंद करें', online: 'ऑनलाइन', offline: 'ऑफ़लाइन',
    title: 'हर दिन थोड़ी और स्वतंत्रता।', subtitle: 'पढ़ने, आसपास को समझने और ज़रूरत पड़ने पर मदद पाने का एक शांत, सक्षम साथी।',
    welcome: 'आपका स्वागत है', quickActions: 'आपको किस मदद की ज़रूरत है?', greeting: 'नमस्ते',
    sceneTitle: 'आसपास का वर्णन', obstacleTitle: 'बाधाएँ पहचानें', documentTitle: 'दस्तावेज़ पढ़ें',
    currencyTitle: 'नोट या बिल पढ़ें', volunteerTitle: 'स्वयंसेवक सहायता', findVolunteerTitle: 'स्वयंसेवक से बात करें', mapTitle: 'समुदाय खतरा नक्शा',
    hazardTitle: 'खतरे की सूचना दें', navigationTitle: 'नेविगेशन अलर्ट', knowledgeTitle: 'चीज़ों के बारे में जानें', sosTitle: 'आपातकालीन SOS',
    contactsTitle: 'विश्वसनीय संपर्क', notificationsTitle: 'सूचनाएँ', settingsTitle: 'सुलभता सेटिंग',
    adminTitle: 'सिस्टम अवलोकन', backDashboard: 'अपने स्थान पर वापस जाएँ', chooseHelp: 'मदद चुनें',
    sceneDetail: 'कैमरा क्या देखता है पूछें', obstacleDetail: 'सावधानीपूर्ण दृश्य मार्गदर्शन',
    documentDetail: 'अपनी भाषा में OCR', currencyDetail: 'दिखाई देने वाली राशि सुनें',
    volunteerDetail: 'सत्यापित व्यक्ति से बात करें', mapDetail: 'समुदाय द्वारा सत्यापित रिपोर्ट',
    reportDetail: 'अपने समुदाय की मदद करें', navigationDetail: 'आसपास के खतरे की सूचना',
    sosDetail: 'अपने लोगों तक पहुँचें',
    knowledgeDetail: 'जानवर, पौधे और संसाधन',
  },
  es: {
    home: 'Inicio', dashboard: 'Panel', scene: 'Describir el entorno', obstacles: 'Detectar obstáculos',
    document: 'Leer un documento', currency: 'Leer dinero', volunteers: 'Buscar un voluntario', map: 'Mapa de riesgos',
    reportHazard: 'Informar de un riesgo', navigation: 'Alertas de navegación', knowledge: 'Aprender sobre temas', sos: 'Emergencia SOS', contacts: 'Contactos de confianza', notifications: 'Notificaciones',
    settings: 'Ajustes de accesibilidad', admin: 'Panel de administración', signIn: 'Iniciar sesión', register: 'Crear cuenta',
    signOut: 'Cerrar sesión', listen: 'Hablar con BALA', stop: 'Dejar de escuchar', online: 'En línea', offline: 'Sin conexión',
    title: 'Un poco más de independencia, cada día.', subtitle: 'Un compañero tranquilo y capaz para leer, explorar y recibir ayuda cuando la necesites.',
    welcome: 'Nos alegra tenerte aquí', quickActions: '¿Con qué necesitas ayuda?', greeting: 'Hola',
    sceneTitle: 'Describir el entorno', obstacleTitle: 'Detectar obstáculos', documentTitle: 'Leer un documento',
    currencyTitle: 'Leer dinero o una factura', volunteerTitle: 'Espacio para voluntarios', findVolunteerTitle: 'Una persona dispuesta a ayudar', mapTitle: 'Mapa comunitario de riesgos',
    hazardTitle: 'Informar de un riesgo', navigationTitle: 'Alertas de navegación', knowledgeTitle: 'Aprender sobre temas', sosTitle: 'Emergencia SOS',
    contactsTitle: 'Contactos de confianza', notificationsTitle: 'Notificaciones', settingsTitle: 'Ajustes de accesibilidad',
    adminTitle: 'Resumen del sistema', backDashboard: 'Volver a tu espacio', chooseHelp: 'Elige cómo recibir ayuda',
    sceneDetail: 'Pregunta qué ve la cámara', obstacleDetail: 'Orientación visual prudente',
    documentDetail: 'OCR en tu idioma preferido', currencyDetail: 'Escucha los importes visibles',
    volunteerDetail: 'Habla con una persona verificada', mapDetail: 'Informes verificados por la comunidad',
    reportDetail: 'Ayuda a tu comunidad', navigationDetail: 'Avisos de riesgos cercanos',
    sosDetail: 'Comunícate con tus personas de confianza',
    knowledgeDetail: 'Animales, plantas y recursos',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { user, updateUser } = useAuth();
  const [savedLanguage, setSavedLanguage] = useState(() => localStorage.getItem('bala-language') || 'en');
  const storedLanguage = user?.language || savedLanguage;
  const language = LANGUAGE_BY_CODE[storedLanguage] ? storedLanguage : 'en';
  useEffect(() => {
    document.documentElement.lang = LANGUAGE_BY_CODE[language].locale;
  }, [language]);
  const value = useMemo(() => ({
    language,
    locale: LANGUAGE_BY_CODE[language].locale,
    setLanguage: async (nextLanguage) => {
      if (!LANGUAGE_CODES.includes(nextLanguage)) throw new Error('Choose a supported language.');
      localStorage.setItem('bala-language', nextLanguage);
      setSavedLanguage(nextLanguage);
      if (user) {
        const response = await api.put('/users/preferences', { language: nextLanguage });
        updateUser(response.data.data.user);
      }
    },
    t: (key) => messages[language]?.[key] || messages.en[key] || key,
  }), [language, user, updateUser]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider.');
  return value;
}
