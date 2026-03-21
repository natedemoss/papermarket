export default function Logo({ size = 28 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background rounded square */}
            <rect width="32" height="32" rx="8" fill="#3B74FF"/>
            {/* Candlestick chart marks */}
            {/* Left bar */}
            <rect x="7" y="18" width="3" height="8" rx="1.5" fill="white" opacity="0.4"/>
            <rect x="8" y="14" width="1" height="5" rx="0.5" fill="white" opacity="0.4"/>
            <rect x="8" y="25" width="1" height="2" rx="0.5" fill="white" opacity="0.4"/>
            {/* Middle bar (tall, bright) */}
            <rect x="14" y="10" width="3" height="14" rx="1.5" fill="white"/>
            <rect x="15" y="7" width="1" height="4" rx="0.5" fill="white" opacity="0.7"/>
            <rect x="15" y="23" width="1" height="3" rx="0.5" fill="white" opacity="0.7"/>
            {/* Right bar */}
            <rect x="21" y="14" width="3" height="10" rx="1.5" fill="white" opacity="0.7"/>
            <rect x="22" y="11" width="1" height="4" rx="0.5" fill="white" opacity="0.5"/>
            <rect x="22" y="23" width="1" height="2" rx="0.5" fill="white" opacity="0.5"/>
        </svg>
    )
}
