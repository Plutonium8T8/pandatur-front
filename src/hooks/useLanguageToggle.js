import { useState, useEffect } from "react";

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
  const [language, setLanguage] = useState("RO");

  useEffect(() => {
    const storedLanguage = localStorage.getItem("language") || "RO";
    setLanguage(storedLanguage);
  }, []);

  const toggleLanguage = () => {
    const newLanguage = language === "RO" ? "RU" : "RO";
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);

    window.location.reload();
  };

  return {
    toggleLanguage,
    selectedLanguage: language,
  };
};
