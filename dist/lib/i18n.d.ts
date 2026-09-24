/**
 * Lightweight i18n for the widget chrome. The agent itself replies in the
 * customer's language; these strings cover the widget UI only.
 */
export type WidgetLocale = 'en' | 'bn' | 'ja';
export interface WidgetStrings {
    online: string;
    reconnecting: string;
    endChat: string;
    minimize: string;
    cart: string;
    placeholder: string;
    typeMessage: string;
    retry: string;
    send: string;
    checkout: string;
    cartEmpty: string;
    subtotal: string;
    tax: string;
    shipping: string;
    free: string;
    coins: string;
    useCoins: (n: number) => string;
    total: string;
    cashOnDelivery: string;
    card: string;
    placeOrderCash: string;
    continueToPayment: string;
    payNow: (amount: string) => string;
    processing: string;
    delivery: string;
    payment: string;
    deliveryDate: string;
    deliveryTime: string;
    loginToContinue: string;
    email: string;
    password: string;
    loginAndContinue: string;
    orderPlaced: string;
    orderNo: string;
    done: string;
    tryAgain: string;
    noAddress: string;
    addAddress: string;
    freeShipHint: (amount: string) => string;
}
export declare function getStrings(locale?: WidgetLocale): WidgetStrings;
