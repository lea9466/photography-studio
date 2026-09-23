import Link from 'next/link'
import Image from 'next/image'
import styles from './nova.module.css'

const BRAND_NAME = 'STG'

export function NovaHero() {
  return (
    <section className={styles.hero}>
      <div className={styles['hero-beam']} aria-hidden="true" />

      <div className={`${styles['hero-inner']} ${styles.container}`}>
        <div className={styles['hero-text']}>
          <span className={`${styles['hero-eyebrow']} ${styles['fade-in-up']} ${styles['delay-1']}`}>
            ✦ {BRAND_NAME}
          </span>

          <h1 className={`${styles['fade-in-up']} ${styles['delay-2']}`}>
            האתר והגלריות שהעבודה שלך ראויה להן.
          </h1>

          <p className={`${styles['fade-in-up']} ${styles['delay-3']}`}>
            בונים לך אתר צילום שמרשים כבר במבט ראשון, וגלריות פרטיות אלגנטיות ללקוחות — הכל במקום
            אחד, בלי להתפשר על העיצוב.
          </p>

          <div className={`${styles['hero-buttons']} ${styles['fade-in-up']} ${styles['delay-4']}`}>
            <Link href="/register" className={styles['primary-btn']}>
              להתחיל בחינם
            </Link>
            <Link href="/lea-studio" className={styles['secondary-btn']}>
              לצפות בדוגמה חיה
            </Link>
          </div>
        </div>

        <div className={`${styles['hero-visual']} ${styles['fade-in-up']} ${styles['delay-3']}`}>
          <div className={styles['hero-glow']} aria-hidden="true" />

          <div className={styles['hero-photo-wrap']}>
            <Image
              className={styles['hero-photo']}
              src="/marketing/nova/hero-photo.webp"
              width={1312}
              height={1199}
              priority
              alt="דוגמה לאתר וגלריה שנבנו במערכת"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
