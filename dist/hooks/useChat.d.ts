import type { ChatMessage, ChatSession, ChatWidgetConfig } from '../types';
/**
 * Core chat hook — manages state, API calls, and SSE streaming.
 */
export declare function useChat(config: ChatWidgetConfig): {
    isOpen: boolean;
    isLoading: boolean;
    session: ChatSession | null;
    messages: ChatMessage[];
    error: string | null;
    toolStatus: string | null;
    isAiEnabled: boolean;
    isAgentTyping: boolean;
    toggle: () => void;
    sendMessage: (text: string) => Promise<void>;
    sendTyping: (isTyping: boolean) => void;
    uploadFile: (file: File) => Promise<void>;
    endChat: () => Promise<void>;
    cancelRequest: () => void;
    linkSession: (customerId: number) => Promise<void>;
    submitFeedback: (rating: number, comment?: string) => Promise<void>;
};
