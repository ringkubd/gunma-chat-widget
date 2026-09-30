interface MessageInputProps {
    onSend: (text: string) => void;
    onUpload?: (file: File) => void;
    onTyping?: (isTyping: boolean) => void;
    isLoading: boolean;
    placeholder: string;
    /** Optional explicit recognition locale; otherwise auto-detected. */
    speechLang?: string;
    /** Texts to script-detect the recognition language from (e.g. last message). */
    languageSamples?: Array<string | null | undefined>;
}
export declare function MessageInput({ onSend, onUpload, onTyping, isLoading, placeholder, speechLang, languageSamples }: MessageInputProps): import("react/jsx-runtime").JSX.Element;
export {};
