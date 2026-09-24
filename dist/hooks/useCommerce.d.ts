import type { ChatWidgetConfig, CommerceAddress, CommerceCartItem, CommerceDeliveryInfo, CommerceStep } from '../types';
import { CommerceApi } from '../lib/commerceApi';
export interface UseCommerceResult {
    enabled: boolean;
    step: CommerceStep;
    setStep: (s: CommerceStep) => void;
    cart: CommerceCartItem[];
    subtotal: number;
    totalTax: number;
    shippingCharge: number;
    total: number;
    addresses: CommerceAddress[];
    selectedAddress: CommerceAddress | null;
    selectAddress: (a: CommerceAddress) => void;
    deliveryInfo: CommerceDeliveryInfo | null;
    earliestDate: string | null;
    deliveryDate: string;
    setDeliveryDate: (d: string) => void;
    deliveryTime: string;
    setDeliveryTime: (t: string) => void;
    coins: number;
    appliedCoins: number;
    setAppliedCoins: (n: number) => void;
    grandTotal: number;
    email: string;
    customerName: string;
    orderId: number | string | null;
    successOrderId: number | string | null;
    successDelivery: {
        date?: string | null;
        time?: string | null;
    };
    errorMessage: string | null;
    stripeSecret: string | null;
    loading: boolean;
    refreshCart: () => Promise<CommerceCartItem[]>;
    stockIssues: StockIssue[];
    hasStockIssues: boolean;
    fixStockIssue: (issueId: number | string) => Promise<void>;
    removeStockIssue: (issueId: number | string) => Promise<void>;
    fixAllStockIssues: () => Promise<void>;
    saveAddress: (payload: Record<string, any>, id?: number | string) => Promise<CommerceAddress>;
    removeItem: (id: number | string) => Promise<void>;
    startCheckout: () => Promise<void>;
    confirmCash: () => Promise<void>;
    prepareCard: () => Promise<void>;
    confirmCard: (stripe: any, elements: any) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (payload: {
        name: string;
        contact_no: string;
        email: string;
        password: string;
    }) => Promise<void>;
    api: CommerceApi;
    stripePublishableKey?: string;
    currencySymbol: string;
    freeShippingThreshold: number;
    freeShippingExcludedState: string;
    orderCutoffTime: string;
}
export interface StockIssue {
    id: number | string;
    title: string;
    reason: 'out_of_stock' | 'insufficient' | 'unavailable' | 'offline';
    /** Requested quantity in the cart. */
    requested: number;
    /** Available stock (null when unknown). */
    available: number | null;
    /** Whether this issue can be auto-fixed by adjusting quantity (insufficient). */
    fixable: boolean;
}
/**
 * Pure stock pre-validation. Given cart items (with embedded product data),
 * return the items that cannot be ordered so the customer is warned BEFORE
 * checkout/payment. Kept outside the hook so it can be tested directly.
 */
export declare function computeStockIssues(cart: CommerceCartItem[]): StockIssue[];
export declare function useCommerce(config: ChatWidgetConfig, opts?: {
    onCartChanged?: () => void;
}): UseCommerceResult;
