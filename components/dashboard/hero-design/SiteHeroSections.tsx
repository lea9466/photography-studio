'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { ProfileForm } from '@/components/dashboard/ProfileForm'
import { HeroDesignEditor } from './HeroDesignEditor'

type SiteHeroSectionsProps = {
  profileFormProps: Omit<ComponentProps<typeof ProfileForm>, 'view' | 'hideFloatingSave'>
  heroEditorProps: ComponentProps<typeof HeroDesignEditor>
}

/**
 * The "סקשן ראשי" page body: the hero images form, then the hero design
 * editor. The images form's floating save button slides away while the
 * editor is on screen — the editor has its own save, and two "save" buttons
 * for two different things were easy to mix up.
 */
export function SiteHeroSections({ profileFormProps, heroEditorProps }: SiteHeroSectionsProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [editorInView, setEditorInView] = useState(false)

  useEffect(() => {
    const element = editorRef.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setEditorInView(entry.isIntersecting), {
      // "On screen" = the editor fills a real part of the viewport, not just a sliver at the bottom.
      rootMargin: '0px 0px -35% 0px',
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <ProfileForm {...profileFormProps} view="hero" hideFloatingSave={editorInView} />
      <div ref={editorRef}>
        <HeroDesignEditor {...heroEditorProps} />
      </div>
    </>
  )
}
