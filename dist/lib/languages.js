/** Curated list — the agent can reply in these; UI dict exists for en/bn/ja. */
export const LANGUAGES = [
    { code: 'bn', label: 'বাংলা', name: 'Bengali' },
    { code: 'en', label: 'English', name: 'English' },
    { code: 'ja', label: '日本語', name: 'Japanese' },
    { code: 'hi', label: 'हिन्दी', name: 'Hindi' },
    { code: 'ur', label: 'اردو', name: 'Urdu' },
    { code: 'ne', label: 'नेपाली', name: 'Nepali' },
    { code: 'ta', label: 'தமிழ்', name: 'Tamil' },
    { code: 'te', label: 'తెలుగు', name: 'Telugu' },
    { code: 'ar', label: 'العربية', name: 'Arabic' },
    { code: 'zh', label: '中文', name: 'Chinese' },
    { code: 'ko', label: '한국어', name: 'Korean' },
];
export const LANG_STORAGE_KEY = 'gunma_chat_lang';
export function loadStoredLanguage() {
    try {
        if (typeof window === 'undefined')
            return null;
        return localStorage.getItem(LANG_STORAGE_KEY);
    }
    catch {
        return null;
    }
}
export function storeLanguage(code) {
    try {
        if (typeof window !== 'undefined')
            localStorage.setItem(LANG_STORAGE_KEY, code);
    }
    catch {
        /* ignore */
    }
}
/** Best-guess default from the browser when the customer hasn't chosen. */
export function defaultLanguage() {
    try {
        const nav = (typeof navigator !== 'undefined' && (navigator.language || (navigator.languages && navigator.languages[0]))) || '';
        const primary = nav.split('-')[0].toLowerCase();
        if (primary)
            return primary;
    }
    catch {
        /* ignore */
    }
    return 'en';
}
