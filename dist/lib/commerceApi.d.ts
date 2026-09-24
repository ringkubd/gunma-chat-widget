/**
 * CommerceApi — talks to the HOST storefront endpoints (same ones the site uses)
 * so in-chat checkout behaves identically to the website checkout.
 *
 * All requests: credentials:'include', Bearer token from localStorage['tk'],
 * X-Visitor-Id, and X-XSRF-TOKEN (fetched from /sanctum/csrf-cookie).
 */
import type { CommerceAddress, CommerceCartItem, CommerceDeliveryInfo, CommerceOrderResult } from '../types';
export interface CommerceApiConfig {
    /** API origin, e.g. https://beta-api.gunmahalalfood.com */
    apiBase: string;
    /** Customer route prefix, default: /customer/Frontend */
    routePrefix?: string;
    /** Bearer token resolver (localStorage['tk'] by default). */
    getToken?: () => string | null;
    /** Guest cart cookie (localStorage['cookie'] by default). */
    getCookie?: () => string | null;
    /** Visitor id resolver (localStorage['vid'] by default). */
    getVisitorId?: () => string | null;
}
export declare class CommerceApi {
    private apiBase;
    private prefix;
    private getToken;
    private getCookie;
    private getVisitorId;
    private csrfReady;
    constructor(config: CommerceApiConfig);
    private url;
    private readXsrf;
    private ensureCsrf;
    private headers;
    private normalize;
    private request;
    /**
     * Does a response body represent a failure even though HTTP was 200?
     * The Gunma backend wraps failures as {success:false} or {status:4xx}.
     */
    static bodyIndicatesError(body: any): boolean;
    /** Extract a human-readable error message from a response body. */
    private errorMessage;
    getCart(): Promise<CommerceCartItem[]>;
    removeCartItem(id: number | string): Promise<void>;
    /** Update a cart line's quantity (host PATCH /Carts/{id}). */
    updateCartItem(id: number | string, body: Record<string, any>): Promise<void>;
    getDefaultAddresses(): Promise<CommerceAddress[]>;
    getAllAddresses(): Promise<CommerceAddress[]>;
    createAddress(payload: Record<string, any>): Promise<CommerceAddress>;
    getPostCodes(value: string): Promise<any[]>;
    getDeliveryInfo(postalCode: string): Promise<CommerceDeliveryInfo>;
    getCurrentDateTime(): Promise<{
        order_cutoff_time?: string;
    }>;
    getDayOff(): Promise<any>;
    getCoins(): Promise<number>;
    applyCoins(coins: number, totalAmount: number): Promise<void>;
    deleteCoins(): Promise<void>;
    login(email: string, password: string): Promise<{
        token: string;
        user?: any;
    }>;
    /**
     * Register a new customer. Mirrors the storefront /Register payload
     * (name, contact_no, email, password, cookie) and stores the returned token.
     */
    register(payload: {
        name: string;
        contact_no: string;
        email: string;
        password: string;
        country?: string;
        native_language?: string;
    }): Promise<{
        token: string;
        user?: any;
    }>;
    isLoggedIn(): Promise<boolean>;
    createOrder(payload: Record<string, any>): Promise<CommerceOrderResult>;
    getStripeSecret(amount: number, email: string, orderId: number | string): Promise<string>;
    confirmStripeOrder(id: number | string, body: Record<string, any>): Promise<void>;
}
