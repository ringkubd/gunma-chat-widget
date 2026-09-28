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
}
export declare function ChatBubble({ isOpen, onClick, brandColor, unreadCount, speech, chips, onChipClick, variant }: ChatBubbleProps): import("react/jsx-runtime").JSX.Element;
export {};
