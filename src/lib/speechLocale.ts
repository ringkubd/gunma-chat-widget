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

/** Map a Unicode block (by first char) to a speech locale. */
function localeForCodePoint(cp: number): string | null {
  if (cp >= 0x0980 && cp <= 0x09ff) return 'bn-BD'; // Bengali
  if (cp >= 0x0900 && cp <= 0x097f) return 'hi-IN'; // Devanagari (Hindi)
  if (cp >= 0x0600 && cp <= 0x06ff) return 'ur-PK'; // Arabic script (Urdu)
  if (cp >= 0x0750 && cp <= 0x077f) return 'ur-PK'; // Arabic Supplement
  if (cp >= 0x0a00 && cp <= 0x0a7f) return 'pa-IN'; // Gurmukhi (Punjabi)
  if (cp >= 0x0a80 && cp <= 0x0aff) return 'gu-IN'; // Gujarati
  if (cp >= 0x0b80 && cp <= 0x0bff) return 'ta-IN'; // Tamil
  if (cp >= 0x0c00 && cp <= 0x0c7f) return 'te-IN'; // Telugu
  if (cp >= 0x0c80 && cp <= 0x0cff) return 'kn-IN'; // Kannada
  if (cp >= 0x0d00 && cp <= 0x0d7f) return 'ml-IN'; // Malayalam
  if (cp >= 0x0d80 && cp <= 0x0dff) return 'si-LK'; // Sinhala
  if ((cp >= 0x3040 && cp <= 0x30ff) || (cp >= 0x4e00 && cp <= 0x9fff)) return 'ja-JP'; // Japanese
  if (cp >= 0xac00 && cp <= 0xd7af) return 'ko-KR'; // Korean
  if (cp >= 0x0400 && cp <= 0x04ff) return 'ru-RU'; // Cyrillic
  return null;
}

/**
 * Detect the best speech locale for the given sample text, or null when the
 * script is unknown (Latin / empty / numbers / emoji).
 */
export function detectSpeechLocale(sample?: string | null): string | null {
  if (!sample) return null;
  for (const ch of sample.normalize('NFC')) {
    const cp = ch.codePointAt(0);
    if (cp == null) continue;
    const loc = localeForCodePoint(cp);
    if (loc) return loc;
  }
  // No native script found — try a conservative romanized-language heuristic.
  return detectRomanizedLocale(sample);
}

/* Distinctive romanized function words for Banglish vs Hinglish. */
const BANGLISH_MARKERS = [
  'amar', 'tomar', 'apni', 'apnar', 'kemon', 'kotha', 'korte', 'korbo', 'korchi',
  'lagbe', 'lagle', 'chai', 'dao', 'den', 'bolen', 'bolo', 'ache', 'achhe', 'nai',
  'koto', 'kemon', 'bhalo', 'valo', 'taka', 'kinbo', 'anbo', 'pathao', 'dibo',
  'hobe', 'hoy', 'kore', 'keno', 'kothay', 'kobe', 'kichu', 'ekta', 'ektu',
];
const HINGLISH_MARKERS = [
  'mujhe', 'chahiye', 'kitna', 'kitne', 'kya', 'hai', 'hain', 'karo', 'karna',
  'nahi', 'nahin', 'dena', 'dijiye', 'batao', 'kaise', 'kaisa', 'mera', 'mere',
  'aap', 'aapka', 'paise', 'rupees', 'milega', 'khana', 'banana', 'dekhna',
];

/**
 * Conservative romanized detection: only fires when the text clearly contains
 * several Banglish/Hinglish function words, to avoid false positives on
 * ordinary English.
 */
export function detectRomanizedLocale(sample: string): string | null {
  const words = sample.toLowerCase().match(/[a-z]+/g);
  if (!words || words.length === 0) return null;
  const set = new Set(words);
  const bn = BANGLISH_MARKERS.filter((w) => set.has(w)).length;
  const hi = HINGLISH_MARKERS.filter((w) => set.has(w)).length;
  // Require a confident signal (≥2 distinctive words) and a clear winner.
  if (bn >= 2 && bn >= hi) return 'bn-BD';
  if (hi >= 2 && hi > bn) return 'hi-IN';
  return null;
}

/**
 * Resolve the final recognition locale.
 *
 * @param opts.override   explicit host/config tag (highest priority)
 * @param opts.samples    texts to script-detect from (typed value, last message)
 */
export function resolveSpeechLocale(opts: {
  override?: string | null;
  samples?: Array<string | null | undefined>;
}): string {
  if (opts.override && opts.override.trim()) return opts.override.trim();

  for (const s of opts.samples ?? []) {
    const loc = detectSpeechLocale(s);
    if (loc) return loc;
  }

  // Browser preference (e.g. "en-GB", "ja", "bn").
  try {
    const nav = (typeof navigator !== 'undefined' && (navigator.language || (navigator.languages && navigator.languages[0]))) || null;
    if (nav) return nav;
  } catch { /* ignore */ }

  return 'en-US';
}
