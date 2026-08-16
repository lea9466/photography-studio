import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#7c3aed',
          borderRadius: 7,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5A1.5 1.5 0 0 1 9.75 4h4.5a1.5 1.5 0 0 1 1.25.75L16.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
            fill="#ffffff"
          />
          <circle cx="12" cy="13" r="3.5" fill="#7c3aed" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
