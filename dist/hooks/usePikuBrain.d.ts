import type { PikuSignal } from './usePikuSignals';
export interface PikuChip {
    label: string;
    prefill: string;
}
interface Cue {
    type: string;
    text: string;
    product?: {
        product_id: number;
        title: string;
    };
    chips?: PikuChip[];
    /** Optional server metadata for the brain. */
    weight?: number;
    cooldownMs?: number;
    compose?: boolean;
}
interface BrainOpts {
    enabled: boolean;
    chatOpen: boolean;
    apiUrl?: string;
    routePrefix?: string;
    lang?: string;
    getSessionId?: () => string | null;
    getToken?: () => string | null;
    getVisitorId?: () => string | null;
    /** Host override lines (doodle.texts.general). */
    generalLines?: string[];
    /** Allow soft idle tips (default true; caller disables on mobile). */
    allowIdleChatter?: boolean;
    maxBudget?: number;
}
export declare function usePikuBrain(opts: BrainOpts): {
    readonly message: string | null;
    readonly chips: PikuChip[];
    readonly blink: boolean;
    readonly talking: boolean;
    readonly decide: (signal: PikuSignal) => Promise<void>;
    readonly speak: (text: string, cue?: Cue) => void;
    readonly prefillRef: import("react").MutableRefObject<string | undefined>;
    readonly onSignal: (signal: PikuSignal) => Promise<void>;
};
export {};
