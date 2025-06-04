import { useLocalStorage } from "@hooks";

const LANGUAGE_LOCAL_STORAGE_KEY = "language";

export const LANGUAGES = {
  RO: {
    label: "RO",
    icon: "🇷🇴",
  },
  RU: {
    label: "RU",
    icon: "🇷🇺",
  },
  EN: {
    label: "EN",
    icon: "🇬🇧",
  },
};

export const LANGUAGE_OPTIONS = Object.keys(LANGUAGES).map((key) => ({
  value: key,
  label: `${LANGUAGES[key].icon} ${LANGUAGES[key].label}`,
}));

export const useLanguageToggle = () => {
  const { storage, changeLocalStorage } = useLocalStorage(
    LANGUAGE_LOCAL_STORAGE_KEY,
    LANGUAGES.RO.label,
  );

  const setLanguage = (lang) => {
    if (LANGUAGES[lang]) {
      changeLocalStorage(lang);
      window.location.reload();
    }
  };

  return {
    setLanguage,
    selectedLanguage: storage || "RO",
    LANGUAGE_OPTIONS,
    LANGUAGES
  };
};
