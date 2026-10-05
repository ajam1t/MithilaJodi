/**
 * A Maithil bride and groom seen from behind at sunrise, facing the river —
 * the groom in his Paag and pitambar with a maroon dupatta, the bride in a red
 * saree with the ghoonghat drawn over her head, hands held, their clothes
 * joined by the gathbandhan knot. Soft, backlit fills with a fine gold rim
 * where the low sun catches the edges. Decorative only.
 */
export function MithilaCouple({ className = '' }: { className?: string }) {
  const rim = { stroke: '#EBCB82', strokeWidth: 0.9, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 220 262" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="mcKurta" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#B07A2A" /><stop offset="0.5" stopColor="#D8A548" /><stop offset="1" stopColor="#A26C22" /></linearGradient>
        <linearGradient id="mcDhoti" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#D8C29C" /><stop offset="0.55" stopColor="#F4E6C8" /><stop offset="1" stopColor="#CBB088" /></linearGradient>
        <linearGradient id="mcPaag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B8323F" /><stop offset="1" stopColor="#7A1220" /></linearGradient>
        <linearGradient id="mcSaree" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6B0E25" /><stop offset="0.5" stopColor="#9E1C3E" /><stop offset="1" stopColor="#640F26" /></linearGradient>
        <linearGradient id="mcVeil" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stopColor="#C02E52" /><stop offset="1" stopColor="#8A1634" /></linearGradient>
        <radialGradient id="mcShadow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#5A3A32" stopOpacity="0.3" /><stop offset="1" stopColor="#5A3A32" stopOpacity="0" /></radialGradient>
      </defs>

      <ellipse cx="114" cy="250" rx="96" ry="8" fill="url(#mcShadow)" />

      {/* ───────────── Groom ───────────── */}
      {/* dhoti, with its pleats and gold border */}
      <path d="M58 146H101L99 241H86L80 186 76 241H61Z" fill="url(#mcDhoti)" {...rim} />
      <path d="M61 238H76M86 238H99" stroke="#C89B45" strokeWidth="2.2" />
      <path d="M70 150 68 238M93 150 94 238" stroke="#B89A6C" strokeWidth="0.7" strokeOpacity="0.55" fill="none" />
      {/* kurta: sloped shoulders, easing out to the knee */}
      <path d="M60 67C64 61 71 59 78 59C85 59 92 61 96 67C99 72 100 82 100 94C100 112 101 128 104 150C90 154 68 154 54 150C57 128 57 112 57 94C57 82 58 72 60 67Z" fill="url(#mcKurta)" {...rim} />
      {/* left sleeve, hanging */}
      <path d="M60 68C55 74 53 89 53 105C53 118 54 128 56 136L61.5 135C60.5 124 60.5 110 61 97C61.4 86 61.2 76 60 68Z" fill="url(#mcKurta)" {...rim} />
      <ellipse cx="58.5" cy="138" rx="3" ry="3.6" fill="#8A5440" />
      {/* right sleeve, reaching for her hand */}
      <path d="M96 68C101 74 104 88 107 102C109 111 111 118 113 123L108 126C105 118 102 109 99.5 99C97.5 90 95.5 79 93.5 72Z" fill="url(#mcKurta)" {...rim} />
      {/* maroon dupatta over the shoulder, across the back, its end at the right hip */}
      <path d="M61 66C76 72 91 92 103 124L97 127C87 102 73 81 58 73Z" fill="#8B1235" {...rim} />
      <path d="M98 122C103 146 103 166 100 190L93.5 190C95.5 166 95.5 146 93 125Z" fill="#8B1235" {...rim} />
      <path d="M93.5 189H100" stroke="#F1D58A" strokeWidth="2.2" />
      {/* neck and the back of the head */}
      <path d="M73 50C73 55 74 58 75 60H82C83 58 84 55 84 50Z" fill="#8A5440" />
      <ellipse cx="78.5" cy="46" rx="10.5" ry="11" fill="#3A2620" />
      {/* the paag: broader than the head, crowned, with its raised front crest */}
      <path d="M65.5 44C64 31 70 23 79 22C88 21 94.5 26 94.5 33C98 35 99 40 96.5 44C90 47.5 71 48 65.5 44Z" fill="url(#mcPaag)" {...rim} />
      <path d="M72.5 25C74 15 86 13 90 22C86 20 78 20 72.5 25Z" fill="url(#mcPaag)" {...rim} />
      <path d="M65.8 43.5C72 47 90 47 96.5 43.8" fill="none" stroke="#E7B54A" strokeWidth="2.2" />
      <path d="M67 37C73 39.5 89 39.5 95.5 37" fill="none" stroke="#F1D58A" strokeWidth="0.9" strokeDasharray="1.6 2.2" />
      <circle cx="80.5" cy="30" r="1.9" fill="#F1D58A" />

      {/* ───────────── Bride ───────────── */}
      {/* saree, flaring to the hem, gold border */}
      <path d="M121 132H177C183 168 189 204 196 241H106C110 204 115 168 121 132Z" fill="url(#mcSaree)" {...rim} />
      <path d="M107.5 232H195" stroke="#E0B455" strokeWidth="3.6" />
      <path d="M106.5 238H196" stroke="#E0B455" strokeWidth="1" />
      {[133, 145, 157, 169].map(x => (
        <path key={x} d={`M${x} 138C${x - 2} 172 ${x - 6} 202 ${x - 10} 229`} stroke="#4A0A1A" strokeOpacity="0.32" strokeWidth="0.8" fill="none" />
      ))}
      {/* her arm, emerging from the veil to hold his hand */}
      <path d="M126 92C122 102 118 112 115 121L110.5 120C113 111 116.5 101 121 92Z" fill="#9E1C3E" {...rim} />
      {/* ghoonghat: over the head, settling on the shoulders, falling to the hips */}
      <path d="M135 41C134 28 158 27 158.5 41C158.7 47 158 52 160 57C166 61 170 68 171 80C172.5 98 175 118 179 138C162 143 138 143 119 138C123 118 125.5 98 127 80C128 68 131 61 136.5 57C135.5 52 134.7 47 135 41Z" fill="url(#mcVeil)" />
      <path d="M135 41C134 28 158 27 158.5 41C158.7 47 158 52 160 57C166 61 170 68 171 80C172.5 98 175 118 179 138" fill="none" stroke="#E0B455" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M136.5 57C131 61 128 68 127 80C125.5 98 123 118 119 138" fill="none" stroke="#E0B455" strokeWidth="1.3" strokeLinecap="round" />
      {[[147, 46], [152, 70], [140, 84], [160, 98], [146, 112], [163, 124], [132, 124]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.25" fill="#F6DC94" />
      ))}

      {/* hands held */}
      <ellipse cx="112" cy="123.5" rx="4.4" ry="3.8" fill="#8A5440" stroke="#EBCB82" strokeWidth="0.8" />

      {/* gathbandhan: his dupatta tied to her saree */}
      <path d="M97 184C106 199 116 198 123 178" fill="none" stroke="#E7B54A" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="109.5" cy="194.5" r="3.2" fill="#E7B54A" stroke="#C89B45" strokeWidth="0.8" />
      <path d="M109.5 197.5l-2.6 8M109.5 197.5l2.6 8" stroke="#E7B54A" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
