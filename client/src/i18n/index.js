import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./en.json";
import ml from "./ml.json";

// In case i18next-browser-languagedetector config needs customized localStorage key
const detectionOptions = {
    order: ["localStorage", "navigator"],
    lookupLocalStorage: "i18n-lang",
    caches: ["localStorage"],
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ml: { translation: ml }
        },
        fallbackLng: "en",
        debug: false,
        interpolation: {
            escapeValue: false // react already safes from xss
        },
        detection: detectionOptions
    });

export default i18n;
