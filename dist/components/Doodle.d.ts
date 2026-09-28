export interface DoodleConfig {
    enabled?: boolean;
    /** 'robot' (default) = Piku mascot bot; 'chef' = rice-bowl chef. */
    variant?: 'robot' | 'chef';
    /** Follow the cursor (desktop). Default FALSE — chef stays put. */
    followCursor?: boolean;
    /** Random idle chit-chat. Default false (product-focus only). */
    speakIdle?: boolean;
    /** Warm greeting once per page load. Default true. */
    greetOnce?: boolean;
    /** Nudge probability per tick when idle. Default 0.3. */
    talkChance?: number;
    /** Corner position. Default 'bottom-right'. */
    position?: 'bottom-left' | 'bottom-right';
    /** Pixel size of the chef. Default 48. */
    size?: number;
    /** Enable the occasional pan-stir action. Default true. */
    stir?: boolean;
    /** Max bubbles per session. Default 5. */
    maxMessages?: number;
    /** First message delay (ms). Default 2500. */
    startDelayMs?: number;
    /** Min gap between bubbles (ms). Default 45000. */
    minGapMs?: number;
    texts?: {
        product?: string[];
        general?: string[];
    };
}
interface Props {
    doodle: DoodleConfig;
    brandColor: string;
    /** Chat panel open → doodle hides. */
    chatOpen?: boolean;
    /** Open chat with optional prefill context. */
    onOpenChat: (prefill?: string) => void;
    /** Backend API base (for pre-generated blurbs + suggestions). */
    apiUrl?: string;
    /** Chat route prefix (default api/chat). */
    routePrefix?: string;
    /** Current chat session id (may be null for guests). */
    getSessionId?: () => string | null;
    /** Widget locale hint (en|bn|ja). */
    lang?: string;
}
export declare function PikuDoodle({ doodle, brandColor, chatOpen, onOpenChat, apiUrl, routePrefix, getSessionId, lang }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
