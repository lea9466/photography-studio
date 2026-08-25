import type { CSSProperties, ReactNode } from 'react'
import styles from './SectionTitle.module.css'

export type SectionTitleProps = {
  children: ReactNode
  color?: string
  className?: string
  style?: CSSProperties
}

export function SectionTitle({ children, color, className = '', style }: SectionTitleProps) {
  return (
    <h2 className={`${styles.title} ${className}`.trim()} style={{ color, ...style }}>
      {children}
    </h2>
  )
}
