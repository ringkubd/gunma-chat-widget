export interface DoodleConfig {
    enabled?: boolean;
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
}
export declare function PikuDoodle({ doodle, brandColor, chatOpen, onOpenChat }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
