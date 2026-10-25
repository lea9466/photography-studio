import type { CSSProperties } from 'react'
import type { HeroLayoutId } from '@/lib/public-site/hero-settings'
import { cn } from '@/lib/utils'
import styles from './LayoutThumb.module.css'

type Box = CSSProperties

const Photo = ({ className, style, alt }: { className?: string; style?: Box; alt?: boolean }) => (
  <span className={cn(styles.photo, alt && styles.photoAlt, className)} style={style} />
)
const Bar = ({ style, light, thin }: { style: Box; light?: boolean; thin?: boolean }) => (
  <span className={cn(styles.bar, light && styles.barLight, thin && styles.barThin)} style={style} />
)
const Chip = ({ style }: { style: Box }) => <span className={styles.chip} style={style} />

function Pieces({ layout }: { layout: HeroLayoutId }) {
  switch (layout) {
    case 'cinema':
      return (
        <>
          <Photo className={styles.full} />
          <span className={styles.shade} />
          <Bar light style={{ top: '38%', left: '25%', right: '25%', height: '9%' }} />
          <Bar light thin style={{ top: '54%', left: '33%', right: '33%' }} />
          <Chip style={{ top: '66%', left: '42%' }} />
        </>
      )
    case 'split':
      return (
        <>
          <Photo className={styles.leftHalf} />
          <Bar style={{ top: '36%', right: '7%', width: '30%', height: '8%' }} />
          <Bar thin style={{ top: '52%', right: '7%', width: '26%' }} />
          <Chip style={{ top: '64%', right: '7%' }} />
        </>
      )
    case 'frame':
      return (
        <>
          <Photo className={styles.framed} />
          <span className={styles.label} />
          <Bar style={{ bottom: '28%', right: '9%', width: '36%', height: '7%' }} />
          <Bar thin style={{ bottom: '11%', right: '7%', width: '34%' }} />
          <Chip style={{ bottom: '9%', left: '7%' }} />
        </>
      )
    case 'arch':
      return (
        <>
          <Photo className={styles.arch} />
          <Photo alt className={styles.dot} />
          <Bar style={{ top: '38%', right: '9%', width: '34%', height: '8%' }} />
          <Bar thin style={{ top: '53%', right: '9%', width: '30%' }} />
          <Chip style={{ top: '64%', right: '9%' }} />
        </>
      )
    case 'trio':
      return (
        <>
          <Bar style={{ top: '14%', left: '30%', right: '30%', height: '7%' }} />
          <Bar thin style={{ top: '26%', left: '36%', right: '36%' }} />
          <Photo alt className={styles.cell} style={{ right: '5%', top: '52%' }} />
          <Photo className={styles.cell} style={{ left: '36%', right: '36%', width: 'auto', top: '40%' }} />
          <Photo alt className={styles.cell} style={{ left: '5%', top: '52%' }} />
        </>
      )
    case 'mag':
      return (
        <>
          <Bar style={{ top: '12%', left: '6%', right: '6%', height: '17%' }} />
          <Photo className={styles.wide} />
          <Bar thin style={{ bottom: '10%', right: '6%', width: '40%' }} />
          <Chip style={{ bottom: '8%', left: '6%' }} />
        </>
      )
    case 'film':
      return (
        <>
          <Bar style={{ top: '14%', left: '30%', right: '30%', height: '7%' }} />
          <Bar thin style={{ top: '27%', left: '36%', right: '36%' }} />
          {[2, 23, 44, 65, 86].map((left, i) => (
            <Photo
              key={left}
              alt={i % 2 === 1}
              className={styles.card}
              style={{ left: `${left - 8}%`, transform: `rotate(${i % 2 ? 2 : -2}deg)` }}
            />
          ))}
        </>
      )
    case 'pano':
      return (
        <>
          <Bar style={{ top: '16%', right: '6%', width: '40%', height: '8%' }} />
          <Photo className={styles.band} />
          <Bar thin style={{ bottom: '16%', right: '6%', width: '44%' }} />
          <Chip style={{ bottom: '13%', left: '6%' }} />
        </>
      )
    case 'stamp':
      return (
        <>
          <Photo className={styles.leaf} />
          <span className={styles.leafShade} />
          <Bar light style={{ bottom: '38%', right: '12%', width: '38%', height: '8%' }} />
          <Bar light thin style={{ bottom: '30%', right: '12%', width: '28%' }} />
          <Chip style={{ bottom: '19%', right: '12%', borderRadius: '999px' }} />
          <span className={styles.seal} />
        </>
      )
  }
}

export function LayoutThumb({ layout }: { layout: HeroLayoutId }) {
  return (
    <div className={styles.thumb} aria-hidden="true">
      <Pieces layout={layout} />
    </div>
  )
}
