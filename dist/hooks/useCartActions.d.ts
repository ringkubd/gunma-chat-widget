interface UseCartActionsConfig {
    apiUrl: string;
}
/**
 * Extracted cart action logic — keeps ChatWidget.tsx clean.
 * Handles single-product "Add to Cart" and bulk "Add ALL Ingredients" clicks.
 */
export declare function useCartActions(config: UseCartActionsConfig): {
    handleMessageClick: (e: React.MouseEvent) => Promise<void>;
};
export {};
