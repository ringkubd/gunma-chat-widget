import React from 'react';
interface ChatBubbleProps {
    isOpen: boolean;
    onClick: () => void;
    brandColor: string;
    unreadCount: number;
}
export declare function ChatBubble({ isOpen, onClick, brandColor, unreadCount }: ChatBubbleProps): React.JSX.Element;
export {};
