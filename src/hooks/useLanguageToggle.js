import { useLocalStorage } from "../hooks";

const LANGUAGE_LOCAL_STORAGE_KEY = "PANDA_TUR_LANGUAGE";

export const LANGUAGES = {
  RO: {
    label: "RO",
    icon: "🇷🇴",
  },
  RU: {
    label: "RU",
    icon: "🇷🇺",
  },
};

export const useLanguageToggle = () => {
  const { storage, changeLocalStorage } = useLocalStorage(
    LANGUAGE_LOCAL_STORAGE_KEY,
    LANGUAGES.RO.label,
  );

  const toggleLanguage = () => {
    const newLanguage = storage === "RO" ? "RU" : "RO";
    changeLocalStorage(newLanguage);

    window.location.reload();
  };

  return {
    toggleLanguage,
    selectedLanguage: storage || "RO",
  };
};
