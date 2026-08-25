import type { ReactNode } from 'react'
import styles from './GallerySectionHeader.module.css'

export function GallerySectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className={styles.header}>
      <div className={styles.headerInner}>{children}</div>
    </div>
  )
}
