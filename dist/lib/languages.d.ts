/**
 * Language selection for the chat widget.
 *
 * The customer can pick the language they want Piku to reply in. The choice is
 * persisted in localStorage and sent to the agent on every request (header
 * `X-Chat-Lang`) so replies follow it — the agent then mirrors native script.
 *
 * The widget chrome strings are fully translated for en/bn/ja; for other
 * languages the UI stays in English while Piku still replies in the chosen
 * language.
 */
export type WidgetLocale = 'en' | 'bn' | 'ja';
export interface LanguageOption {
    /** BCP-47 primary code sent to the agent (e.g. 'bn', 'hi', 'ja'). */
    code: string;
    /** Native label shown in the picker. */
    label: string;
    /** English name (for aria/title). */
    name: string;
}
/** Curated list — the agent can reply in these; UI dict exists for en/bn/ja. */
export declare const LANGUAGES: LanguageOption[];
export declare const LANG_STORAGE_KEY = "gunma_chat_lang";
export declare function loadStoredLanguage(): string | null;
export declare function storeLanguage(code: string): void;
/** Best-guess default from the browser when the customer hasn't chosen. */
export declare function defaultLanguage(): string;
