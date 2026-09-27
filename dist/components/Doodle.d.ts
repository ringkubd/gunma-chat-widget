export interface DoodleConfig {
    enabled?: boolean;
    texts?: {
        productPage?: string;
        bubbleDefault?: string;
    };
}
interface Props {
    doodle: DoodleConfig;
    brandColor: string;
    onOpenChat: () => void;
}
export declare function PikuDoodle({ doodle, brandColor, onOpenChat }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
