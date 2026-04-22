interface MessageInputProps {
    onSend: (text: string) => void;
    onUpload?: (file: File) => void;
    isLoading: boolean;
    placeholder: string;
}
export declare function MessageInput({ onSend, onUpload, isLoading, placeholder }: MessageInputProps): import("react/jsx-runtime").JSX.Element;
export {};
