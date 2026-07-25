import i18n from "i18next";

export const getLocale = () => {
    return i18n.language || "en";
};

export const formatDate = (date, options = {}) => {
    if (!date) return "";
    const d = new Date(date);
    return new Intl.DateTimeFormat(getLocale(), {
        dateStyle: "medium",
        ...options
    }).format(d);
};

export const formatTime = (date, options = {}) => {
    if (!date) return "";
    const d = new Date(date);
    return new Intl.DateTimeFormat(getLocale(), {
        timeStyle: "short",
        ...options
    }).format(d);
};

export const formatNumber = (num, options = {}) => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    return new Intl.NumberFormat(getLocale(), options).format(num);
};

export const formatPercentage = (num, options = {}) => {
    if (num === null || num === undefined || isNaN(num)) return "0%";
    // If the percentage value is passed as a whole number (e.g. 50 representing 50%), divide by 100
    const normalized = num > 1 ? num / 100 : num;
    return new Intl.NumberFormat(getLocale(), {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options
    }).format(normalized);
};
