import type { ReactNode } from 'react'
import styles from './ClassicSectionScript.module.css'

export function ClassicSectionScript({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className={styles.script} aria-hidden="true" style={{ color }}>
      {children}
    </span>
  )
}
