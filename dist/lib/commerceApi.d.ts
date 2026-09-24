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
    getCart(): Promise<CommerceCartItem[]>;
    removeCartItem(id: number | string): Promise<void>;
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
    isLoggedIn(): Promise<boolean>;
    createOrder(payload: Record<string, any>): Promise<CommerceOrderResult>;
    getStripeSecret(amount: number, email: string, orderId: number | string): Promise<string>;
    confirmStripeOrder(id: number | string, body: Record<string, any>): Promise<void>;
}
