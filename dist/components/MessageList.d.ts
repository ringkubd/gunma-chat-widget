import type { ChatMessage } from '../types';
interface MessageListProps {
    messages: ChatMessage[];
    welcomeMessage: string;
    brandColor: string;
    websiteUrl: string;
    /** Currency symbol shown on product cards. Default: '¥'. */
    currencySymbol?: string;
}
export declare function MessageList({ messages, welcomeMessage, brandColor, websiteUrl, currencySymbol }: MessageListProps): import("react/jsx-runtime").JSX.Element;
export {};
