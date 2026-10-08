import { createContext, useContext } from 'react';

const VoiceAssistantContext = createContext(null);

export function VoiceAssistantProvider({ value, children }) {
  return <VoiceAssistantContext.Provider value={value}>{children}</VoiceAssistantContext.Provider>;
}

export function useVoiceAssistant() {
  const value = useContext(VoiceAssistantContext);
  if (!value) throw new Error('useVoiceAssistant must be used inside VoiceAssistantProvider.');
  return value;
}
