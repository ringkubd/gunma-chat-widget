import type { ChatMessage } from '../types';
interface MessageBubbleProps {
    message: ChatMessage;
    brandColor: string;
    websiteUrl: string;
}
export declare function MessageBubble({ message, brandColor, websiteUrl }: MessageBubbleProps): import("react/jsx-runtime").JSX.Element;
export {};
