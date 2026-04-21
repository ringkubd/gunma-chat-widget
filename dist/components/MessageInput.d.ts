interface MessageInputProps {
    onSend: (text: string) => void;
    isLoading: boolean;
    placeholder: string;
}
export declare function MessageInput({ onSend, isLoading, placeholder }: MessageInputProps): import("react/jsx-runtime").JSX.Element;
export {};
