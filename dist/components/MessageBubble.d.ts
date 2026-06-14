import React from 'react';
import type { ChatMessage } from '../types';
interface MessageBubbleProps {
    message: ChatMessage;
    brandColor: string;
    websiteUrl: string;
}
export declare function MessageBubble({ message, brandColor, websiteUrl }: MessageBubbleProps): React.JSX.Element;
export {};
