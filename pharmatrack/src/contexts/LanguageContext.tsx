import { createContext, useContext, useState, type ReactNode } from 'react';
type Language = 'en' | 'fr';
interface LanguageContextType { language: Language; setLanguage: (l: Language) => void; }
const LanguageContext = createContext<LanguageContextType>({ language: 'en', setLanguage: () => {} });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>((localStorage.getItem('pharmatrack-lang') as Language) || 'en');
  const handleSet = (l: Language) => { setLanguage(l); localStorage.setItem('pharmatrack-lang', l); };
  return <LanguageContext.Provider value={{ language, setLanguage: handleSet }}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
