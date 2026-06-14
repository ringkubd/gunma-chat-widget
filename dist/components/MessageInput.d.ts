import React from 'react';
interface MessageInputProps {
    onSend: (text: string) => void;
    onUpload?: (file: File) => void;
    onTyping?: (isTyping: boolean) => void;
    isLoading: boolean;
    placeholder: string;
}
export declare function MessageInput({ onSend, onUpload, onTyping, isLoading, placeholder }: MessageInputProps): React.JSX.Element;
export {};
