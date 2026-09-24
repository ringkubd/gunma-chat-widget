import type { UseCommerceResult } from '../../hooks/useCommerce';
import { type WidgetStrings } from '../../lib/i18n';
interface CommercePanelProps {
    commerce: UseCommerceResult;
    brandColor: string;
    onClose: () => void;
    /** Whether the chat header's cart button opened this panel. */
    freeShippingThreshold: number;
    /** UI strings (i18n). */
    strings?: WidgetStrings;
}
export declare function CommercePanel({ commerce, brandColor, onClose, strings }: CommercePanelProps): import("react/jsx-runtime").JSX.Element;
export {};
