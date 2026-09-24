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
  registerTab: string;
  loginTab: string;
  fullName: string;
  phone: string;
  createAccount: string;
  haveAccount: string;
  noAccount: string;
  orderPlaced: string;
  orderNo: string;
  done: string;
  tryAgain: string;
  noAddress: string;
  addAddress: string;
  freeShipHint: (amount: string) => string;
}

const en: WidgetStrings = {
  online: 'Online',
  reconnecting: 'Reconnecting...',
  endChat: 'End chat',
  minimize: 'Minimize',
  cart: 'Cart & checkout',
  placeholder: 'Type a message...',
  typeMessage: 'Type a message...',
  retry: 'Retry',
  send: 'Send',
  checkout: 'Checkout',
  cartEmpty: 'Your cart is empty.',
  subtotal: 'Subtotal',
  tax: 'Tax',
  shipping: 'Shipping',
  free: 'Free',
  coins: 'Coins',
  useCoins: (n) => `Use ${n} loyalty coins`,
  total: 'Total',
  cashOnDelivery: 'Cash on Delivery',
  card: 'Credit / Debit Card',
  placeOrderCash: 'Place order (Cash)',
  continueToPayment: 'Continue to payment',
  payNow: (amount) => `Pay ${amount}`,
  processing: 'Processing your order…',
  delivery: 'Delivery',
  payment: 'Payment',
  deliveryDate: 'Delivery date',
  deliveryTime: 'Delivery time',
  loginToContinue: 'Please log in to continue checkout.',
  email: 'Email',
  password: 'Password',
  loginAndContinue: 'Log in & continue',
  registerTab: 'Create account',
  loginTab: 'Log in',
  fullName: 'Full name',
  phone: 'Phone number',
  createAccount: 'Create account & continue',
  haveAccount: 'Already have an account?',
  noAccount: "Don't have an account?",
  orderPlaced: 'Order placed successfully!',
  orderNo: 'Order No.',
  done: 'Done',
  tryAgain: 'Try again',
  noAddress: 'No delivery address found.',
  addAddress: 'Add a new address',
  freeShipHint: (amount) => `Add ${amount} more for free shipping.`,
};

const bn: WidgetStrings = {
  ...en,
  online: 'অনলাইন',
  reconnecting: 'পুনঃসংযোগ হচ্ছে...',
  endChat: 'চ্যাট শেষ করুন',
  minimize: 'ছোট করুন',
  cart: 'কার্ট ও চেকআউট',
  placeholder: 'বার্তা লিখুন...',
  typeMessage: 'বার্তা লিখুন...',
  retry: 'আবার চেষ্টা',
  send: 'পাঠান',
  checkout: 'চেকআউট',
  cartEmpty: 'আপনার কার্ট খালি।',
  subtotal: 'সাবটোটাল',
  tax: 'ট্যাক্স',
  shipping: 'শিপিং',
  free: 'ফ্রি',
  coins: 'কয়েন',
  useCoins: (n) => `${n} লয়্যালটি কয়েন ব্যবহার করুন`,
  total: 'মোট',
  cashOnDelivery: 'ক্যাশ অন ডেলিভারি',
  card: 'ক্রেডিট / ডেবিট কার্ড',
  placeOrderCash: 'অর্ডার করুন (ক্যাশ)',
  continueToPayment: 'পেমেন্টে যান',
  payNow: (amount) => `${amount} পরিশোধ করুন`,
  processing: 'আপনার অর্ডার প্রক্রিয়া করা হচ্ছে…',
  delivery: 'ডেলিভারি',
  payment: 'পেমেন্ট',
  deliveryDate: 'ডেলিভারির তারিখ',
  deliveryTime: 'ডেলিভারির সময়',
  loginToContinue: 'চেকআউট চালিয়ে যেতে লগইন করুন।',
  email: 'ইমেইল',
  password: 'পাসওয়ার্ড',
  loginAndContinue: 'লগইন করে চালিয়ে যান',
  registerTab: 'অ্যাকাউন্ট খুলুন',
  loginTab: 'লগইন',
  fullName: 'পুরো নাম',
  phone: 'ফোন নম্বর',
  createAccount: 'অ্যাকাউন্ট খুলে চালিয়ে যান',
  haveAccount: 'আগে থেকেই অ্যাকাউন্ট আছে?',
  noAccount: 'অ্যাকাউন্ট নেই?',
  orderPlaced: 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!',
  orderNo: 'অর্ডার নম্বর',
  done: 'সম্পন্ন',
  tryAgain: 'আবার চেষ্টা করুন',
  noAddress: 'কোনো ডেলিভারি ঠিকানা পাওয়া যায়নি।',
  addAddress: 'নতুন ঠিকানা যোগ করুন',
  freeShipHint: (amount) => `ফ্রি শিপিংয়ের জন্য আরও ${amount} যোগ করুন।`,
};

const ja: WidgetStrings = {
  ...en,
  online: 'オンライン',
  reconnecting: '再接続中...',
  endChat: 'チャットを終了',
  minimize: '最小化',
  cart: 'カートと会計',
  placeholder: 'メッセージを入力...',
  typeMessage: 'メッセージを入力...',
  retry: '再試行',
  send: '送信',
  checkout: '会計',
  cartEmpty: 'カートは空です。',
  subtotal: '小計',
  tax: '税',
  shipping: '送料',
  free: '無料',
  coins: 'コイン',
  useCoins: (n) => `${n} ポイントを使用`,
  total: '合計',
  cashOnDelivery: '代金引換',
  card: 'クレジット / デビットカード',
  placeOrderCash: '注文する（代金引換）',
  continueToPayment: '支払いへ進む',
  payNow: (amount) => `${amount} を支払う`,
  processing: '注文を処理しています…',
  delivery: '配送',
  payment: '支払い',
  deliveryDate: '配送日',
  deliveryTime: '配送時間',
  loginToContinue: '会計を続けるにはログインしてください。',
  email: 'メール',
  password: 'パスワード',
  loginAndContinue: 'ログインして続行',
  registerTab: 'アカウント作成',
  loginTab: 'ログイン',
  fullName: 'お名前',
  phone: '電話番号',
  createAccount: 'アカウントを作成して続行',
  haveAccount: 'すでにアカウントをお持ちですか？',
  noAccount: 'アカウントをお持ちでないですか？',
  orderPlaced: 'ご注文が完了しました！',
  orderNo: '注文番号',
  done: '完了',
  tryAgain: 'もう一度試す',
  noAddress: '配送先住所が見つかりません。',
  addAddress: '新しい住所を追加',
  freeShipHint: (amount) => `あと ${amount} で送料無料。`,
};

const DICTS: Record<WidgetLocale, WidgetStrings> = { en, bn, ja };

export function getStrings(locale?: WidgetLocale): WidgetStrings {
  return DICTS[locale ?? 'en'] ?? en;
}
