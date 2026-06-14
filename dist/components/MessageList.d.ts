import React from 'react';
import type { ChatMessage } from '../types';
interface MessageListProps {
    messages: ChatMessage[];
    welcomeMessage: string;
    brandColor: string;
    websiteUrl: string;
}
export declare function MessageList({ messages, welcomeMessage, brandColor, websiteUrl }: MessageListProps): React.JSX.Element;
export {};
