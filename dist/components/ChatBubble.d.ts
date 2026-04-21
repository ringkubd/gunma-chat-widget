interface ChatBubbleProps {
    isOpen: boolean;
    onClick: () => void;
    brandColor: string;
    unreadCount: number;
}
export declare function ChatBubble({ isOpen, onClick, brandColor, unreadCount }: ChatBubbleProps): import("react/jsx-runtime").JSX.Element;
export {};
