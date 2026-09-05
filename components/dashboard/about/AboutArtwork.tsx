/**
 * Small decorative line illustrations for the guide-page heroes. Flat,
 * geometric, dashboard-accent + pastel. Marked as images with a short label
 * for assistive tech; they carry no information the surrounding text lacks.
 */

export function ShieldPhotoArtwork() {
  return (
    <svg
      width="144"
      height="144"
      viewBox="0 0 144 144"
      fill="none"
      role="img"
      aria-label="גלריה מוגנת"
      className="drop-shadow-sm"
    >
      <path
        d="M72 10 L122 26 V70 C122 101 100 123 72 134 C44 123 22 101 22 70 V26 Z"
        fill="#7D3A52"
        fillOpacity="0.07"
        stroke="#7D3A52"
        strokeOpacity="0.35"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect
        x="42"
        y="40"
        width="54"
        height="42"
        rx="7"
        fill="#ffffff"
        stroke="#7D3A52"
        strokeOpacity="0.28"
        strokeWidth="2"
      />
      <rect
        x="50"
        y="50"
        width="54"
        height="42"
        rx="7"
        fill="#fdf1f5"
        stroke="#7D3A52"
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      <circle cx="66" cy="64" r="6" fill="#f4c674" />
      <path d="M56 84 L72 66 L92 84 Z" fill="#a9d3e6" />
      <circle cx="72" cy="110" r="16" fill="#7D3A52" />
      <rect x="65" y="106" width="14" height="11" rx="2.5" fill="#ffffff" />
      <path
        d="M67.5 106 V102 A4.5 4.5 0 0 1 76.5 102 V106"
        stroke="#ffffff"
        strokeWidth="2.5"
        fill="none"
      />
    </svg>
  )
}

export function BrowserArtwork() {
  return (
    <svg
      width="184"
      height="150"
      viewBox="0 0 184 150"
      fill="none"
      role="img"
      aria-label="אתר תדמית"
      className="drop-shadow-sm"
    >
      <rect
        x="6"
        y="8"
        width="172"
        height="134"
        rx="12"
        fill="#ffffff"
        stroke="#7D3A52"
        strokeOpacity="0.3"
        strokeWidth="2"
      />
      <path
        d="M6 20 C6 13.4 11.4 8 18 8 H166 C172.6 8 178 13.4 178 20 V32 H6 Z"
        fill="#7D3A52"
        fillOpacity="0.06"
      />
      <circle cx="20" cy="20" r="3.5" fill="#e9a8bc" />
      <circle cx="32" cy="20" r="3.5" fill="#f4c674" />
      <circle cx="44" cy="20" r="3.5" fill="#9fd8c4" />
      <rect x="18" y="42" width="148" height="40" rx="7" fill="#7D3A52" fillOpacity="0.10" />
      <rect x="28" y="55" width="60" height="7" rx="3.5" fill="#7D3A52" fillOpacity="0.5" />
      <rect x="28" y="67" width="38" height="6" rx="3" fill="#7D3A52" fillOpacity="0.28" />
      <rect x="18" y="92" width="44" height="34" rx="6" fill="#bfe0ef" />
      <rect x="70" y="92" width="44" height="34" rx="6" fill="#f6d9a6" />
      <rect x="122" y="92" width="44" height="34" rx="6" fill="#e7c2d1" />
    </svg>
  )
}
