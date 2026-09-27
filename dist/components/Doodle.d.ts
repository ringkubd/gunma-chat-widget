export interface DoodleConfig {
    enabled?: boolean;
    /** Follow the customer's pointer (desktop only). Default true. */
    followCursor?: boolean;
    /** Pointer mode: nudges should still occur. Default: 0.18 bubble chance on long idle. */
    talkChance?: number;
    texts?: {
        product?: string[];
        general?: string[];
    };
}
interface Props {
    doodle: DoodleConfig;
    brandColor: string;
    /** Chat panel open state — doodle hides itself while chatting. */
    chatOpen?: boolean;
    /** Open chat; carries an optional prefill context message. */
    onOpenChat: (prefill?: string) => void;
}
export declare function PikuDoodle({ doodle, brandColor, chatOpen, onOpenChat }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
