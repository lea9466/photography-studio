'use client'

import { useState } from 'react'
import styles from './nova.module.css'

// Hosted on R2 (public branding/ prefix of the albums bucket), not in public/.
// Approved for opening in NetFree.
const R2 = 'https://albums.studio-galleries.com/branding/marketing'

export const DEMO_VIDEOS = {
  publicSite: {
    src: `${R2}/public-site-demo.mp4`,
    poster: `${R2}/public-site-demo-poster.jpg`,
    label: 'סרטון הדגמה: בניית אתר ב-STG',
  },
  privateGalleries: {
    src: `${R2}/private-galleries-demo.mp4`,
    poster: `${R2}/private-galleries-demo-poster.jpg`,
    label: 'סרטון הדגמה: גלריות פרטיות ב-STG',
  },
} as const

type NovaDemoVideoProps = {
  video: (typeof DEMO_VIDEOS)[keyof typeof DEMO_VIDEOS]
}

/**
 * Poster with a play button; the video file itself only loads after the click,
 * so the homepage stays light. Native controls cover sound, seeking and
 * fullscreen.
 */
export function NovaDemoVideo({ video }: NovaDemoVideoProps) {
  const [started, setStarted] = useState(false)

  return (
    <div className={styles['demo-video']}>
      {started ? (
        <video
          className={styles['demo-video-media']}
          src={video.src}
          poster={video.poster}
          aria-label={video.label}
          controls
          autoPlay
          playsInline
        />
      ) : (
        <button
          type="button"
          className={styles['demo-video-poster']}
          onClick={() => setStarted(true)}
          aria-label={`הפעלת ${video.label}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- remote R2 poster, not worth a next/image domain entry */}
          <img className={styles['demo-video-media']} src={video.poster} alt="" loading="lazy" />
          <span className={styles['demo-video-play']} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}
