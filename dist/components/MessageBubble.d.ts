import type { ChatMessage } from '../types';
interface MessageBubbleProps {
    message: ChatMessage;
    brandColor: string;
    websiteUrl: string;
    /** Currency symbol for product cards. Default: '¥'. */
    currencySymbol?: string;
}
export declare function MessageBubble({ message, brandColor, websiteUrl, currencySymbol }: MessageBubbleProps): import("react/jsx-runtime").JSX.Element;
export {};
