'use client'

import { useEffect, useRef, useState } from 'react'
import { Gauge, Pause, Play, Volume2, VolumeX } from 'lucide-react'

type AboutDemoVideoProps = {
  id?: string
  src: string
  poster: string
  label: string
}

const SPEEDS = [1, 0.75, 0.5]

const CONTROL_CLASS =
  'inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-black/70'

/**
 * Walkthrough video on an "אודות" guide page. Browsers only autoplay muted
 * video, so it starts silent and plays while it is on screen (paused when
 * scrolled away). The viewer can pause it, slow it down and turn the sound
 * on; once she pauses it herself, scrolling never restarts it.
 */
export function AboutDemoVideo({ id, src, poster, label }: AboutDemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pausedByUser = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [speedIndex, setSpeedIndex] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!pausedByUser.current) {
            video.play().catch(() => {
              // Autoplay refused (e.g. data-saver) — the play button still works.
            })
          }
        } else {
          video.pause()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      pausedByUser.current = false
      video.play().catch(() => {})
    } else {
      pausedByUser.current = true
      video.pause()
    }
  }

  function toggleSound() {
    const video = videoRef.current
    if (!video) return
    video.muted = !muted
    setMuted(!muted)
  }

  function cycleSpeed() {
    const video = videoRef.current
    if (!video) return
    const next = (speedIndex + 1) % SPEEDS.length
    video.playbackRate = SPEEDS[next]
    setSpeedIndex(next)
  }

  return (
    <div
      id={id}
      className="relative scroll-mt-24 overflow-hidden rounded-2xl border border-(--border) bg-[#241536] shadow-[0_10px_30px_rgba(125,58,82,0.12)] md:scroll-mt-8"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="block aspect-video w-full cursor-pointer"
      />
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'עצירה' : 'הפעלה'}
          className={CONTROL_CLASS}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? 'עצירה' : 'הפעלה'}
        </button>
        <button
          type="button"
          onClick={cycleSpeed}
          aria-label={`מהירות ${SPEEDS[speedIndex]}, לחצי לשינוי`}
          className={CONTROL_CLASS}
        >
          <Gauge className="h-4 w-4" />
          {SPEEDS[speedIndex] === 1 ? 'מהירות רגילה' : `מהירות ×${SPEEDS[speedIndex]}`}
        </button>
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? 'הפעלת סאונד' : 'השתקה'}
          className={CONTROL_CLASS}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {muted ? 'הפעלת סאונד' : 'השתקה'}
        </button>
      </div>
    </div>
  )
}
