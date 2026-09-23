'use client'

import { useInView } from './useInView'
import { NovaCountUp } from './NovaCountUp'
import styles from './nova.module.css'
import type { MarketingStat } from '@/lib/marketing/marketing-stats'

type NovaStatsProps = {
  stats: MarketingStat[]
}

/** Real, DB-backed counts (see lib/marketing/marketing-stats.ts) — hidden
 *  entirely if there's nothing worth showing, rather than rendering an
 *  empty band. */
export function NovaStats({ stats }: NovaStatsProps) {
  const [statsRef, statsInView] = useInView()

  if (stats.length === 0) return null

  return (
    <section className={styles.stats} ref={statsRef}>
      <div
        className={`${styles['stats-inner']} ${styles['reveal-strong']} ${statsInView ? styles['in-view'] : ''}`}
      >
        {stats.map((stat) => (
          <div key={stat.key} className={styles['stat-item']}>
            <div className={styles['stat-number']}>
              <NovaCountUp value={stat.value} suffix={stat.plus ? '+' : ''} />
            </div>
            <div className={styles['stat-label']}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
