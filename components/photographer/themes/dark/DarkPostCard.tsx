import Link from 'next/link'
import styles from './DarkPostCard.module.css'

export type DarkHomepagePost = {
  id: string
  title: string
  content: string
  date: string
  coverUrl: string | null
}

export function DarkPostCard({
  post,
  href,
  accentColor,
}: {
  post: DarkHomepagePost
  href: string
  accentColor: string
}) {
  return (
    <Link href={href} className={styles.card}>
      {post.coverUrl ? (
        <div className={styles.media}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverUrl} alt={post.title} className={styles.image} loading="lazy" decoding="async" />
        </div>
      ) : (
        <div className={`${styles.media} ${styles.mediaEmpty}`} aria-hidden="true" />
      )}
      <div className={styles.body}>
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.date} style={{ color: accentColor }}>
          {post.date}
        </p>
        <p className={styles.excerpt}>{post.content}</p>
      </div>
    </Link>
  )
}
