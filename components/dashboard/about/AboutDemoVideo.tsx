'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

type AboutDemoVideoProps = {
  src: string
  poster: string
  label: string
}

/**
 * Walkthrough video on an "אודות" guide page. Browsers only autoplay muted
 * video, so it starts silent and plays while it is on screen (paused when
 * scrolled away); the button turns the sound on.
 */
export function AboutDemoVideo({ src, poster, label }: AboutDemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay refused (e.g. data-saver) — the native controls still work.
          })
        } else {
          video.pause()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  function toggleSound() {
    const video = videoRef.current
    if (!video) return
    video.muted = !muted
    setMuted(!muted)
    if (video.paused) video.play().catch(() => {})
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-(--border) bg-[#241536] shadow-[0_10px_30px_rgba(125,58,82,0.12)]">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        className="block aspect-video w-full"
      />
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? 'הפעלת סאונד' : 'השתקה'}
        className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-black/70"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        {muted ? 'הפעלת סאונד' : 'השתקה'}
      </button>
    </div>
  )
}
