'use client'

import { useEffect, useRef, useState } from 'react'

type ScaledFrameProps = {
  src: string
  title: string
  baseWidth: number
  baseHeight: number
  className?: string
}

export function ScaledFrame({ src, title, baseWidth, baseHeight, className = '' }: ScaledFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => setScale(el.offsetWidth / baseWidth)
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [baseWidth])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[--background] ${className}`}
      style={{ height: baseHeight * scale }}
      dir="ltr"
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: baseWidth,
          height: baseHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <iframe
          src={src}
          title={title}
          width={baseWidth}
          height={baseHeight}
          loading="lazy"
          className="border-0"
        />
      </div>
    </div>
  )
}
