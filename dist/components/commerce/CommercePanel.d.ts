import type { UseCommerceResult } from '../../hooks/useCommerce';
interface CommercePanelProps {
    commerce: UseCommerceResult;
    brandColor: string;
    onClose: () => void;
    /** Whether the chat header's cart button opened this panel. */
    freeShippingThreshold: number;
}
export declare function CommercePanel({ commerce, brandColor, onClose }: CommercePanelProps): import("react/jsx-runtime").JSX.Element;
export {};
