import { Fragment, type ReactNode } from 'react'
import type {
  HomepageSectionId,
  HomepageSectionLayout,
} from '@/lib/public-site/homepage-sections'
import { normalizeHomepageSectionLayout } from '@/lib/public-site/homepage-sections'

/**
 * Renders the movable homepage sections in the photographer's chosen order,
 * skipping hidden ones. Hero and contact are rendered by each theme's
 * HomePage outside this component, so they stay fixed first/last.
 */
export function OrderedHomepageSections({
  layout,
  sections,
}: {
  layout?: HomepageSectionLayout
  sections: Record<HomepageSectionId, ReactNode>
}) {
  return (
    <>
      {normalizeHomepageSectionLayout(layout).map(({ id, visible }) =>
        visible ? <Fragment key={id}>{sections[id]}</Fragment> : null
      )}
    </>
  )
}
