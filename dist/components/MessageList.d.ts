import type { ChatMessage } from '../types';
interface MessageListProps {
    messages: ChatMessage[];
    welcomeMessage: string;
    brandColor: string;
    websiteUrl: string;
}
export declare function MessageList({ messages, welcomeMessage, brandColor, websiteUrl }: MessageListProps): import("react/jsx-runtime").JSX.Element;
export {};
