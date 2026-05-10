interface UseCartActionsConfig {
    /**
     * Base API URL of the Laravel backend (e.g. 'https://api.example.com').
     * Used to build the bulk cart endpoint: `${apiUrl}/api/chat/cart/bulk`.
     */
    apiUrl: string;
    /**
     * Route prefix matching GUNMA_ROUTE_PREFIX (default: 'api/chat').
     * Used to build: `${apiUrl}/${routePrefix}/cart/bulk`.
     */
    routePrefix?: string;
    /**
     * Direct URL for the host app's single-product cart endpoint.
     * If not set, single-product "Add to Cart" buttons will be disabled.
     * Example: 'https://mystore.com/customer/Frontend/Carts'
     */
    cartUrl?: string;
    /**
     * localStorage key for the guest cookie/cart identifier.
     * Default: 'gunma_cookie'
     */
    cookieKey?: string;
    /**
     * Optional Bearer token for authenticated cart requests.
     */
    apiToken?: string;
    /**
     * Optional function to resolve Bearer token dynamically.
     */
    getToken?: () => string | null;
}
/**
 * Extracted cart action logic — keeps ChatWidget.tsx clean.
 * Handles single-product "Add to Cart" and bulk "Add ALL Ingredients" clicks.
 *
 * Works for both guests (cookie-based) and authenticated customers (token-based).
 */
export declare function useCartActions(config: UseCartActionsConfig): {
    handleMessageClick: (e: React.MouseEvent) => Promise<void>;
};
export {};
