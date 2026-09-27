export interface DoodleConfig {
    enabled?: boolean;
    /** ms between behaviour ticks. Default 5000. */
    tickMs?: number;
    /** 0..1 chance per tick to talk. Default 0.35. */
    talkChance?: number;
    /** Vertical band (vh) where the buddy patrols. Default [64, 84]. */
    band?: [number, number];
    texts?: {
        /** Lines with %s = product title shown on product pages. */
        product?: string[];
        /** Everyday lines: recipes, perks, greetings. */
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
