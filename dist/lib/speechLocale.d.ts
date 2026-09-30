/**
 * Smart speech-recognition locale detection for the voice input.
 *
 * The Web Speech API needs an explicit BCP-47 language tag, and hardcoding
 * one (e.g. 'bn-BD') is wrong for a multilingual store. We instead derive the
 * language from (in priority order):
 *   1) an explicit host/override tag (config.speechLang)
 *   2) the SCRIPT of what the customer has typed / the latest message
 *   3) the browser's own language (navigator.language)
 *   4) 'en-US' as a last resort
 *
 * Script detection maps a Unicode code point to the right regional locale.
 */
/**
 * Detect the best speech locale for the given sample text, or null when the
 * script is unknown (Latin / empty / numbers / emoji).
 */
export declare function detectSpeechLocale(sample?: string | null): string | null;
/**
 * Conservative romanized detection: only fires when the text clearly contains
 * several Banglish/Hinglish function words, to avoid false positives on
 * ordinary English.
 */
export declare function detectRomanizedLocale(sample: string): string | null;
/**
 * Resolve the final recognition locale.
 *
 * @param opts.override   explicit host/config tag (highest priority)
 * @param opts.samples    texts to script-detect from (typed value, last message)
 */
export declare function resolveSpeechLocale(opts: {
    override?: string | null;
    samples?: Array<string | null | undefined>;
}): string;
