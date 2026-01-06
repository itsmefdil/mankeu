import { usePreferencesStore } from '@/hooks/usePreferences';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
    value: number;
    currency?: string;
    locale?: string;
}

export const CurrencyDisplay = ({
    value,
    currency: propCurrency,
    locale: propLocale,
    className,
    ...props
}: CurrencyDisplayProps) => {
    const { isAmountHidden, currency: storeCurrency, language } = usePreferencesStore();

    // Use props if provided, otherwise use store
    const currency = propCurrency || storeCurrency;
    const locale = propLocale || language;

    const symbol = currency === 'USD' ? '$' : 'Rp';
    const validLocale = locale === 'id' ? 'id-ID' : 'en-US';

    return (
        <span className={cn("", className)} {...props}>
            {isAmountHidden ? (
                <span className="tracking-widest">•••••••</span>
            ) : (
                <>{symbol} {Number(value).toLocaleString(validLocale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</>
            )}
        </span>
    );
};
