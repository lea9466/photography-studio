import { useId, type ReactNode } from 'react'
import type { HomepageSectionId } from '@/lib/public-site/homepage-sections'
import type { SectionPreviewData } from '@/lib/public-site/homepage-section-previews'

/**
 * Small schematic drawings of each homepage section, filled in with the
 * photographer's own photos where we have them (about portrait, gallery covers). Not theme-accurate on purpose: the four
 * themes share the same structure, so a rough sketch in the site's accent
 * colour is enough to recognise a section while reordering.
 */

type Rect = { x: number; y: number; w: number; h: number; r?: number }

function Block({ x, y, w, h, r = 2, o = 0.28 }: Rect & { o?: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={r} fill="currentColor" fillOpacity={o} />
}

function Line({ x, y, w, o = 0.45 }: { x: number; y: number; w: number; o?: number }) {
  return <rect x={x} y={y} width={w} height={2.4} rx={1.2} fill="currentColor" fillOpacity={o} />
}

/** A real photo when we have one, otherwise the plain placeholder block. */
function Photo({ src, uid, o, ...rect }: Rect & { src?: string; uid: string; o?: number }) {
  if (!src) return <Block {...rect} o={o} />
  const clipId = `${uid}-${rect.x}-${rect.y}`
  return (
    <>
      <clipPath id={clipId}>
        <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} rx={rect.r ?? 2} />
      </clipPath>
      <image
        href={src}
        x={rect.x}
        y={rect.y}
        width={rect.w}
        height={rect.h}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />
    </>
  )
}

function drawing(id: HomepageSectionId, p: SectionPreviewData | undefined, uid: string): ReactNode {
  const covers = p?.galleryCovers ?? []
  const cover = (i: number) => (covers.length ? covers[i % covers.length] : undefined)

  switch (id) {
    case 'about':
      return (
        <>
          <Photo src={p?.aboutImageUrl ?? undefined} uid={uid} x={6} y={6} w={28} h={34} r={3} />
          <Line x={42} y={8} w={36} o={0.7} />
          <Line x={42} y={15} w={46} />
          <Line x={42} y={21} w={42} />
          <Line x={42} y={27} w={30} />
          <Block x={6} y={46} w={24} h={9} o={0.2} />
          <Block x={36} y={46} w={24} h={9} o={0.2} />
          <Block x={66} y={46} w={24} h={9} o={0.2} />
        </>
      )
    case 'galleries':
      return (
        <>
          <Line x={32} y={5} w={32} o={0.7} />
          <Photo src={cover(0)} uid={uid} x={6} y={12} w={40} h={20} />
          <Photo src={cover(1)} uid={uid} x={50} y={12} w={40} h={20} />
          <Photo src={cover(2)} uid={uid} x={6} y={35} w={40} h={20} />
          <Photo src={cover(3)} uid={uid} x={50} y={35} w={40} h={20} />
        </>
      )
    case 'recent_photos':
      return (
        <>
          <Line x={32} y={5} w={32} o={0.7} />
          <Photo src={cover(0)} uid={uid} x={6} y={12} w={26} h={26} />
          <Photo src={cover(1)} uid={uid} x={6} y={41} w={26} h={14} />
          <Photo src={cover(2)} uid={uid} x={35} y={12} w={26} h={14} />
          <Photo src={cover(3)} uid={uid} x={35} y={29} w={26} h={26} />
          <Photo src={cover(1)} uid={uid} x={64} y={12} w={26} h={22} />
          <Photo src={cover(0)} uid={uid} x={64} y={37} w={26} h={18} />
        </>
      )
    case 'posts':
      return (
        <>
          <Line x={32} y={5} w={32} o={0.7} />
          {[6, 35, 64].map((x) => (
            <g key={x}>
              <Block x={x} y={12} w={26} h={22} />
              <Line x={x} y={39} w={22} o={0.6} />
              <Line x={x} y={45} w={26} />
            </g>
          ))}
        </>
      )
    case 'packages':
      return (
        <>
          <Line x={32} y={5} w={32} o={0.7} />
          <Block x={6} y={16} w={26} h={38} o={0.18} />
          <Line x={10} y={22} w={14} o={0.6} />
          <Line x={10} y={30} w={18} />
          <Line x={10} y={36} w={16} />
          <Block x={35} y={12} w={26} h={44} o={0.34} />
          <Line x={39} y={20} w={14} o={0.8} />
          <Line x={39} y={29} w={18} o={0.6} />
          <Line x={39} y={35} w={16} o={0.6} />
          <Block x={64} y={16} w={26} h={38} o={0.18} />
          <Line x={68} y={22} w={14} o={0.6} />
          <Line x={68} y={30} w={18} />
          <Line x={68} y={36} w={16} />
        </>
      )
    case 'testimonials':
      return (
        <>
          <Line x={32} y={5} w={32} o={0.7} />
          <Block x={12} y={13} w={72} h={34} r={4} o={0.16} />
          <Line x={20} y={21} w={56} />
          <Line x={20} y={27} w={50} />
          <Line x={20} y={33} w={40} />
          <circle cx={24} cy={41} r={3} fill="currentColor" fillOpacity={0.4} />
          <Line x={31} y={40} w={18} o={0.6} />
          <circle cx={42} cy={54} r={1.6} fill="currentColor" fillOpacity={0.6} />
          <circle cx={48} cy={54} r={1.6} fill="currentColor" fillOpacity={0.25} />
          <circle cx={54} cy={54} r={1.6} fill="currentColor" fillOpacity={0.25} />
        </>
      )
    case 'faq':
      return (
        <>
          <Line x={32} y={5} w={32} o={0.7} />
          {[13, 25, 37, 49].map((y) => (
            <g key={y}>
              <Block x={8} y={y} w={80} h={9} r={3} o={0.2} />
              <Line x={13} y={y + 3.3} w={40} o={0.6} />
            </g>
          ))}
        </>
      )
  }
}

export function HomepageSectionThumbnail({
  id,
  preview,
}: {
  id: HomepageSectionId
  preview?: SectionPreviewData
}) {
  const uid = useId().replace(/:/g, '')
  const dark = preview?.isDarkTheme ?? false

  return (
    <svg
      viewBox="0 0 96 60"
      className="h-[100px] w-40 shrink-0 rounded-lg border border-[--border]/70"
      style={{
        color: dark ? '#E8E2D8' : (preview?.accentColor ?? '#7D3A52'),
        backgroundColor: dark ? '#17171C' : '#FAF6F7',
      }}
      aria-hidden
    >
      {drawing(id, preview, uid)}
    </svg>
  )
}
