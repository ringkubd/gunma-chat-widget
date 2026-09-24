interface ChatHeaderProps {
    brandName: string;
    brandColor: string;
    onClose: () => void;
    onEndChat: () => void;
    isConnected?: boolean;
    /** When provided, shows a cart button that opens the commerce panel. */
    onCartClick?: () => void;
    /** Number of items in the cart (shows a badge when > 0). */
    cartCount?: number;
}
export declare function ChatHeader({ brandName, brandColor, onClose, onEndChat, isConnected, onCartClick, cartCount }: ChatHeaderProps): import("react/jsx-runtime").JSX.Element;
export {};
