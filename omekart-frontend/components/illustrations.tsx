type IllustrationProps = { className?: string }

export function AuthIllustration({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 420 480" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="avatarBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EDE9FE" />
        </linearGradient>
        <linearGradient id="bagGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF6A1F" />
          <stop offset="100%" stopColor="#FF8A4D" />
        </linearGradient>
        <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(20,18,31,0.18)" />
          <stop offset="100%" stopColor="rgba(20,18,31,0)" />
        </radialGradient>
      </defs>

      <g className="animate-float">
        <circle cx="80" cy="100" r="34" fill="#FFFFFF" opacity="0.18" />
        <circle cx="80" cy="100" r="22" fill="#FFFFFF" />
        <path d="M71 100c0-3 1.6-5 4-6.6V90a5 5 0 0 1 10 0v3.4c2.4 1.6 4 3.6 4 6.6" stroke="#FF6A1F" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>

      <g className="animate-float-delay">
        <circle cx="340" cy="150" r="30" fill="#FFFFFF" opacity="0.18" />
        <circle cx="340" cy="150" r="20" fill="#FFFFFF" />
        <path d="M332 150h16l-2 9a3 3 0 0 1-3 2.4h-6a3 3 0 0 1-3-2.4l-2-9Z" stroke="#2F80ED" strokeWidth="2" fill="none" strokeLinejoin="round" />
      </g>

      <g className="animate-float">
        <circle cx="350" cy="330" r="26" fill="#FFFFFF" opacity="0.16" />
        <circle cx="350" cy="330" r="18" fill="#FFFFFF" />
        <path d="M344 324l12 12M340 330l4 4M346 330l4-4" stroke="#6B3FF6" strokeWidth="2" strokeLinecap="round" />
      </g>

      <path d="M95 112 C 180 60, 260 90, 332 145" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="2" fill="none" className="path-flow" />
      <path d="M95 118 C 160 220, 260 300, 336 322" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="2" fill="none" className="path-flow" />

      <ellipse cx="200" cy="420" rx="78" ry="14" fill="url(#groundShadow)" />
      <path d="M140 420c0-46 26-78 60-78s60 32 60 78H140Z" fill="url(#avatarBody)" />
      <circle cx="200" cy="300" r="42" fill="url(#avatarBody)" />
      <circle cx="186" cy="298" r="3.4" fill="#14121F" />
      <circle cx="214" cy="298" r="3.4" fill="#14121F" />
      <path d="M188 314c4 5 20 5 24 0" stroke="#14121F" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <rect x="226" y="332" width="46" height="50" rx="8" fill="url(#bagGrad)" />
      <path d="M236 332v-8a13 13 0 0 1 26 0v8" stroke="#FF6A1F" strokeWidth="4" fill="none" />
      <rect x="240" y="350" width="18" height="14" rx="2" fill="#FFE6D5" />
    </svg>
  )
}

export function BuyerAvatar({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="buyerSkin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5F3FF" />
          <stop offset="100%" stopColor="#EDE9FE" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="178" rx="56" ry="10" fill="rgba(20,18,31,0.08)" />
      <path d="M55 175c0-38 20-64 45-64s45 26 45 64H55Z" fill="url(#buyerSkin)" />
      <circle cx="100" cy="92" r="34" fill="url(#buyerSkin)" />
      <circle cx="89" cy="90" r="3" fill="#14121F" />
      <circle cx="111" cy="90" r="3" fill="#14121F" />
      <path d="M90 103c4 4 16 4 20 0" stroke="#14121F" strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect x="118" y="118" width="40" height="44" rx="7" fill="#6B3FF6" />
      <path d="M126 118v-7a12 12 0 0 1 24 0v7" stroke="#5530CC" strokeWidth="4" fill="none" />
    </svg>
  )
}

export function SellerAvatar({ className = '' }: IllustrationProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sellerSkin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF3EB" />
          <stop offset="100%" stopColor="#FFE3CF" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="178" rx="58" ry="10" fill="rgba(20,18,31,0.08)" />
      <rect x="34" y="120" width="48" height="46" rx="6" fill="#FFFFFF" stroke="#ECE9F4" strokeWidth="2" />
      <path d="M34 132h48M58 132v34" stroke="#ECE9F4" strokeWidth="2" />
      <path d="M40 120l4-16h32l4 16" stroke="#FF6A1F" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M105 175c0-36 18-60 40-60s40 24 40 60h-80Z" fill="url(#sellerSkin)" />
      <circle cx="145" cy="98" r="30" fill="url(#sellerSkin)" />
      <circle cx="136" cy="96" r="2.6" fill="#14121F" />
      <circle cx="154" cy="96" r="2.6" fill="#14121F" />
      <path d="M137 108c3 3 14 3 17 0" stroke="#14121F" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}