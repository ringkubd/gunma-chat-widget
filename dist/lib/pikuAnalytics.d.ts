/**
 * Tiny fire-and-forget analytics reporter for Piku.
 *
 * Sends business-impact events to POST /piku-events so the dashboard can show
 * how many people Piku helped, how many orders it drove, and revenue. Never
 * throws, never blocks, and drops silently on any failure.
 */
export interface PikuAnalyticsConfig {
    apiUrl?: string;
    routePrefix?: string;
    getSessionId?: () => string | null;
    getVisitorId?: () => string | null;
}
export declare function reportPikuEvent(cfg: PikuAnalyticsConfig, event: string, data?: Record<string, unknown>, meta?: Record<string, unknown>, dedupeKey?: string): void;
