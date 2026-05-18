import { cn } from '@/lib/utils'

interface ToggleSwitchProps {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    disabled?: boolean
    'aria-label': string
}

export function ToggleSwitch({
    checked,
    onCheckedChange,
    disabled = false,
    'aria-label': ariaLabel,
}: ToggleSwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                'relative inline-flex shrink-0 cursor-pointer',
                'w-14 h-[30px] rounded-full',
                'transition-colors duration-200 ease-in-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                checked ? 'bg-[hsl(var(--toggle-on))]' : 'bg-[hsl(var(--toggle-off))]'
            )}
            style={{
                boxShadow: checked
                    ? 'var(--toggle-track-shadow-on)'
                    : 'var(--toggle-track-shadow-off)',
            }}
        >
            <span
                className={cn(
                    'pointer-events-none absolute top-1/2 -translate-y-1/2',
                    'h-[22px] w-[22px] rounded-full bg-white',
                    'transition-transform duration-200 ease-in-out',
                    checked ? 'translate-x-[26px]' : 'translate-x-1'
                )}
                style={{
                    boxShadow: 'var(--toggle-thumb-shadow)',
                }}
            />
        </button>
    )
}
