/**
 * Live hero preview protocol between the dashboard hero editor and the real
 * public site loaded in an iframe (`?heroPreview=1`). The editor posts the
 * unsaved settings; the site renders them instead of the saved ones. Nothing
 * is persisted — closing the editor leaves the site exactly as saved.
 */
export const HERO_PREVIEW_QUERY_PARAM = 'heroPreview'

export const HERO_PREVIEW_SETTINGS_MESSAGE = 'stg:hero-preview:settings'
export const HERO_PREVIEW_READY_MESSAGE = 'stg:hero-preview:ready'

/** Editor → site. `settings: null` = show the theme's own hero. */
export type HeroPreviewSettingsMessage = {
  type: typeof HERO_PREVIEW_SETTINGS_MESSAGE
  settings: unknown
}

/** Site → editor, sent once the site is listening, so the editor (re)sends the current settings. */
export type HeroPreviewReadyMessage = {
  type: typeof HERO_PREVIEW_READY_MESSAGE
}

export function heroPreviewPath(sitePath: string): string {
  return `${sitePath}?${HERO_PREVIEW_QUERY_PARAM}=1`
}
