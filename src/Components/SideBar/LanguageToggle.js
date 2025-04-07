import React, { useState, useEffect } from "react";

const LanguageToggle = () => {
  const [language, setLanguage] = useState("RO");

  // Load language from localStorage when the component mounts
  useEffect(() => {
    const storedLanguage = localStorage.getItem("language") || "RO";
    setLanguage(storedLanguage);
  }, []);

  // Function to toggle and store the language
  const toggleLanguage = () => {
    const newLanguage = language === "RO" ? "RU" : "RO";
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage); // Save in localStorage

    window.location.reload();
  };

  return (
    <button onClick={toggleLanguage}>{language === "RO" ? "🇷🇴" : "🇷🇺"}</button>
  );
};

export default LanguageToggle;
