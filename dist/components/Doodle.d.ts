export interface DoodleConfig {
    enabled?: boolean;
    /** Seconds between doodle "think ticks". Default 4. */
    tickMs?: number;
    /** How often the doodle is allowed to speak, as fraction (0..1). Default 0.55 */
    talkChance?: number;
    texts?: {
        /** Lines shown when a product is on screen ("%s" = product title). */
        product?: string[];
        /** General chat-worthy lines (recipes, offers, greetings). */
        general?: string[];
    };
}
interface Props {
    doodle: DoodleConfig;
    brandColor: string;
    onOpenChat: () => void;
}
export declare function PikuDoodle({ doodle, brandColor, onOpenChat }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
