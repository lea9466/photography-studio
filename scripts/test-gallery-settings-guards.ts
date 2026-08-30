import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertSettingsInputAllowedForType } from '../lib/gallery-settings-guard'

/**
 * A showcase (portfolio) gallery and a client (selection) gallery have disjoint
 * editable settings. The single write path `updateGallerySettings` calls this
 * guard so no caller can push a field that doesn't belong to the kind.
 */

const CLIENT_ONLY = [
  { password: 'secret' },
  { expiresAt: '2026-01-01' },
  { maxAlbumSelection: 50 },
  { maxEditSelection: 30 },
  { allowDownloadPreview: false },
  { allowDownloadOriginal: true },
] as const

test('portfolio: rejects every client-only field (even a falsy value)', () => {
  for (const input of CLIENT_ONLY) {
    assert.throws(
      () => assertSettingsInputAllowedForType('portfolio', input),
      /גלריית לקוח/,
      JSON.stringify(input)
    )
  }
})

test('portfolio: accepts its own fields (cover image, and nothing client-only)', () => {
  assert.doesNotThrow(() =>
    assertSettingsInputAllowedForType('portfolio', { coverImage: 'branding/abc_card.jpg' })
  )
  assert.doesNotThrow(() => assertSettingsInputAllowedForType('portfolio', {}))
})

test('selection: rejects coverImage', () => {
  assert.throws(
    () => assertSettingsInputAllowedForType('selection', { coverImage: 'branding/abc.jpg' }),
    /תמונת שער/
  )
})

test('selection: accepts the full client field set', () => {
  assert.doesNotThrow(() =>
    assertSettingsInputAllowedForType('selection', {
      password: 'secret',
      expiresAt: '2026-01-01',
      maxAlbumSelection: 50,
      maxEditSelection: 30,
      allowDownloadPreview: true,
      allowDownloadOriginal: false,
    })
  )
  assert.doesNotThrow(() => assertSettingsInputAllowedForType('selection', {}))
})

test('undefined fields never throw, for either kind', () => {
  const allUndefined = {
    password: undefined,
    expiresAt: undefined,
    maxAlbumSelection: undefined,
    maxEditSelection: undefined,
    allowDownloadPreview: undefined,
    allowDownloadOriginal: undefined,
    coverImage: undefined,
  }
  assert.doesNotThrow(() => assertSettingsInputAllowedForType('portfolio', allUndefined))
  assert.doesNotThrow(() => assertSettingsInputAllowedForType('selection', allUndefined))
})

test('null / unknown gallery_type is treated as non-showcase (rejects coverImage)', () => {
  assert.throws(() => assertSettingsInputAllowedForType(null, { coverImage: 'x' }), /תמונת שער/)
  assert.throws(() => assertSettingsInputAllowedForType(undefined, { coverImage: 'x' }), /תמונת שער/)
})
