const icons: Record<string, { bg: string; text: string; label: string }> = {
    CRYPTO:   { bg: 'bg-orange-950', text: 'text-orange-400', label: 'BTC' },
    POLITICS: { bg: 'bg-blue-950',   text: 'text-blue-400',   label: 'GOV' },
    SPORTS:   { bg: 'bg-red-950',    text: 'text-red-400',    label: 'SPT' },
    TECH:     { bg: 'bg-purple-950', text: 'text-purple-400', label: 'TCH' },
    SCIENCE:  { bg: 'bg-cyan-950',   text: 'text-cyan-400',   label: 'SCI' },
    FINANCE:  { bg: 'bg-green-950',  text: 'text-green-400',  label: 'FIN' },
    OTHER:    { bg: 'bg-pm-surface', text: 'text-pm-muted',   label: 'MKT' },
}

export default function CategoryIcon({ category, size = 'md' }: { category: string; size?: 'sm' | 'md' }) {
    const cfg = icons[category] ?? icons.OTHER
    const dim = size === 'sm' ? 'w-8 h-8 text-2xs' : 'w-10 h-10 text-2xs'
    return (
        <div className={`${dim} ${cfg.bg} rounded-lg flex-shrink-0 flex items-center justify-center font-bold tracking-wide ${cfg.text}`}>
            {cfg.label}
        </div>
    )
}
