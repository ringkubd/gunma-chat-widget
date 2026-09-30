import { PikuChip } from '../hooks/usePikuSpeech';
interface ChatBubbleProps {
    isOpen: boolean;
    onClick: () => void;
    brandColor: string;
    unreadCount: number;
    speech?: string | null;
    chips?: PikuChip[];
    onChipClick: (prefill?: string) => void;
    variant?: 'robot' | 'chef';
    /** Minimize the floating icon (mobile) → hides it, shows the reopen tab. */
    onMinimize?: () => void;
}
export declare function ChatBubble({ isOpen, onClick, brandColor, unreadCount, speech, chips, onChipClick, variant, onMinimize }: ChatBubbleProps): import("react/jsx-runtime").JSX.Element;
export {};
