export interface PikuChip {
    label: string;
    prefill: string;
}
interface UsePikuSpeechOpts {
    enabled: boolean;
    chatOpen: boolean;
    maxMessages?: number;
    startDelayMs?: number;
    minGapMs?: number;
    apiUrl?: string;
    routePrefix?: string;
    lang?: string;
    getSessionId?: () => string | null;
}
export declare function usePikuSpeech(opts: UsePikuSpeechOpts): {
    readonly message: string | null;
    readonly chips: PikuChip[];
    readonly blink: boolean;
    readonly talking: boolean;
    readonly openWithPrefill: (onOpen: (prefill?: string) => void) => void;
    readonly prefillRef: import("react").MutableRefObject<string | undefined>;
    readonly fetchBriefs: (ids: string[]) => Promise<void>;
};
export {};
