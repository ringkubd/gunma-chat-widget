import type { ChatWidgetConfig } from '../types';
export type PikuSignalType = 'navigation' | 'product_focus' | 'product_hover' | 'intent' | 'engagement' | 'page_dwell' | 'return_visit';
export type EngagementState = 'browsing' | 'deep_reading' | 'idle' | 'away';
export interface PikuSignal {
    type: PikuSignalType;
    at: number;
    /** Product context, when known. */
    productId?: number | null;
    productTitle?: string | null;
    /** Intent sub-type (search/cart_add/wishlist_add/checkout_start). */
    intent?: string | null;
    keyword?: string | null;
    /** Engagement sub-state. */
    state?: EngagementState;
    /** Seconds spent on the current page / product. */
    dwellSeconds?: number;
    url?: string;
}
export declare function usePikuSignals(config: ChatWidgetConfig, onSignal: (s: PikuSignal) => void, enabled?: boolean): void;
