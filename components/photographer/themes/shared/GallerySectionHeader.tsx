import type { ReactNode } from 'react'
import styles from './GallerySectionHeader.module.css'
import { sectionHeadingAlignClass } from './section-heading-align'

export function GallerySectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className={`${styles.header} ${sectionHeadingAlignClass()}`}>
      <div className={styles.headerInner}>{children}</div>
    </div>
  )
}
