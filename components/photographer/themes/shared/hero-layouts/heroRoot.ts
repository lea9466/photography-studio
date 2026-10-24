import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import styles from './HeroBase.module.css'
import type { HeroLayoutProps } from './types'

const TITLE_SIZE_CLASS = { sm: styles.titleSm, md: undefined, lg: styles.titleLg } as const

/** className + CSS variables every layout's root <section> carries. */
export function heroRootProps(props: HeroLayoutProps, layoutClassName: string) {
  return {
    id: 'hero',
    className: cn(styles.root, styles[props.theme], TITLE_SIZE_CLASS[props.settings.titleSize], layoutClassName),
    style: {
      '--hl-accent': props.accentColor,
      '--hl-shade': props.settings.shade / 100,
    } as CSSProperties,
  }
}
