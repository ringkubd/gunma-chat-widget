interface ChatHeaderProps {
    brandName: string;
    brandColor: string;
    onClose: () => void;
    onEndChat: () => void;
    isConnected?: boolean;
}
export declare function ChatHeader({ brandName, brandColor, onClose, onEndChat, isConnected }: ChatHeaderProps): import("react/jsx-runtime").JSX.Element;
export {};
