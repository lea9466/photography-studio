import {
  buildPostCanonicalPath,
  buildPublicGalleryCanonicalPath,
  buildSeoMapPath,
  type DiscoveryGallery,
  type DiscoveryPost,
} from '@/lib/seo/photographer-discovery'

type PhotographerSemanticAnchorsProps = {
  studioPath: string
  studioName: string
  galleries: DiscoveryGallery[]
  posts: DiscoveryPost[]
}

function truncateText(value: string, maxLength = 280): string {
  const singleLine = value.replace(/\s+/g, ' ').trim()
  if (singleLine.length <= maxLength) return singleLine
  return `${singleLine.slice(0, maxLength - 1)}…`
}

export function PhotographerSemanticAnchors({
  studioPath,
  studioName,
  galleries,
  posts,
}: PhotographerSemanticAnchorsProps) {
  if (galleries.length === 0 && posts.length === 0) {
    return null
  }

  return (
    <nav aria-label={`תוכן ציבורי של ${studioName}`} className="sr-only">
      <h2>{studioName}</h2>
      <p>
        <a href={buildSeoMapPath(studioPath)}>מפת תוכן לסריקת מנועי חיפוש</a>
      </p>

      {galleries.length > 0 ? (
        <section aria-labelledby="semantic-galleries-heading">
          <h3 id="semantic-galleries-heading">גלריות</h3>
          <ul>
            {galleries.map((gallery) => (
              <li key={gallery.id}>
                <a href={buildPublicGalleryCanonicalPath(gallery)}>{gallery.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {posts.length > 0 ? (
        <section aria-labelledby="semantic-posts-heading">
          <h3 id="semantic-posts-heading">פוסטים</h3>
          <ul>
            {posts.map((post) => (
              <li key={post.id}>
                <article>
                  <h4>
                    <a href={buildPostCanonicalPath(studioPath, post.id)}>{post.title}</a>
                  </h4>
                  {post.subtitle ? <p>{post.subtitle}</p> : null}
                  <p>{truncateText(post.content)}</p>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </nav>
  )
}
