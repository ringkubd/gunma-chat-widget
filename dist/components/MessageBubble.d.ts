import type { ChatMessage } from '../types';
interface MessageBubbleProps {
    message: ChatMessage;
    brandColor: string;
    websiteUrl: string;
    /** Currency symbol for product cards. Default: '¥'. */
    currencySymbol?: string;
    /** Piku profile picture URL. Falls back to the built-in avatar when absent. */
    avatarUrl?: string;
}
export declare function MessageBubble({ message, brandColor, websiteUrl, currencySymbol, retireCartCtas, avatarUrl }: MessageBubbleProps & {
    retireCartCtas?: boolean;
}): import("react/jsx-runtime").JSX.Element;
export {};
