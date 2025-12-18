import { usePreferencesStore } from '@/hooks/usePreferences';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
    value: number;
    currency?: string;
    locale?: string;
}

export const CurrencyDisplay = ({
    value,
    currency = 'Rp',
    locale = 'id-ID',
    className,
    ...props
}: CurrencyDisplayProps) => {
    const { isAmountHidden } = usePreferencesStore();

    return (
        <span className={cn("", className)} {...props}>
            {isAmountHidden ? (
                <span className="tracking-widest">•••••••</span>
            ) : (
                <>{currency} {Number(value).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</>
            )}
        </span>
    );
};
