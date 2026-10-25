import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_HERO_OPTIONS,
  DEFAULT_HERO_OPTION_TIERS,
  HERO_OPTION_KEYS,
  heroOptionsInUse,
  normalizeHeroOptionTiers,
  normalizeHeroSettings,
  proHeroOptionsInUse,
  resolveHeroSettingsForRender,
  withoutProHeroOptions,
  type HeroSettings,
} from '../lib/public-site/hero-settings.ts'

const settings = (overrides: Partial<HeroSettings> = {}): HeroSettings => ({
  layout: 'cinema',
  ...DEFAULT_HERO_OPTIONS,
  ...overrides,
})

describe('normalizeHeroSettings', () => {
  it('null / garbage / unknown layout = theme hero', () => {
    assert.equal(normalizeHeroSettings(null), null)
    assert.equal(normalizeHeroSettings('cinema'), null)
    assert.equal(normalizeHeroSettings({ layout: 'nope' }), null)
  })
  it('missing options fall back to defaults', () => {
    assert.deepEqual(normalizeHeroSettings({ layout: 'split' }), settings({ layout: 'split' }))
  })
  it('invalid option values fall back to defaults', () => {
    const result = normalizeHeroSettings({ layout: 'pano', transition: 'spin', speedSeconds: 4, titleSize: 'xl' })
    assert.equal(result?.transition, 'fade')
    assert.equal(result?.speedSeconds, 5)
    assert.equal(result?.titleSize, 'md')
  })
  it('shade is clamped to 0–100 and snapped to steps of 5', () => {
    assert.equal(normalizeHeroSettings({ layout: 'cinema', shade: 140 })?.shade, 100)
    assert.equal(normalizeHeroSettings({ layout: 'cinema', shade: -3 })?.shade, 0)
    assert.equal(normalizeHeroSettings({ layout: 'cinema', shade: 42 })?.shade, 40)
  })
})

describe('normalizeHeroOptionTiers', () => {
  it('no rows = code defaults, covering every key', () => {
    const tiers = normalizeHeroOptionTiers([])
    assert.deepEqual(tiers, DEFAULT_HERO_OPTION_TIERS)
    for (const key of HERO_OPTION_KEYS) assert.ok(tiers[key])
  })
  it('rows override defaults; unknown keys and bad tiers are ignored', () => {
    const tiers = normalizeHeroOptionTiers([
      { option_key: 'layout:mag', tier: 'free' },
      { option_key: 'layout:nope', tier: 'free' },
      { option_key: 'speed', tier: 'gold' },
    ])
    assert.equal(tiers['layout:mag'], 'free')
    assert.equal(tiers.speed, DEFAULT_HERO_OPTION_TIERS.speed)
    assert.equal((tiers as Record<string, string>)['layout:nope'], undefined)
  })
})

describe('heroOptionsInUse', () => {
  it('default options use only the layout', () => {
    assert.deepEqual(heroOptionsInUse(settings()), ['layout:cinema'])
  })
  it('changed options are counted', () => {
    assert.deepEqual(
      heroOptionsInUse(settings({ transition: 'zoom', showSecondaryCta: false })),
      ['layout:cinema', 'transition', 'hide_secondary_cta']
    )
  })
  it('options that do nothing on this layout are not counted', () => {
    // trio has no single photo to pin, and no text-on-photo darkening or scroll cue
    assert.deepEqual(
      heroOptionsInUse(settings({ layout: 'trio', pinOnScroll: true, shade: 80, showScrollCue: false })),
      ['layout:trio']
    )
  })
  it('pin counts on a pinnable layout', () => {
    assert.ok(heroOptionsInUse(settings({ layout: 'pano', pinOnScroll: true })).includes('pin_on_scroll'))
  })
})

describe('resolveHeroSettingsForRender', () => {
  const tiers = DEFAULT_HERO_OPTION_TIERS

  it('no saved settings = theme hero for everyone', () => {
    assert.equal(resolveHeroSettingsForRender(null, tiers, true), null)
    assert.equal(resolveHeroSettingsForRender(null, tiers, false), null)
  })
  it('free studio keeps a fully-free hero', () => {
    const saved = settings({ layout: 'split', speedSeconds: 8 })
    assert.deepEqual(resolveHeroSettingsForRender(saved, tiers, false), saved)
  })
  it('free studio with a PRO layout falls back to the theme hero', () => {
    assert.equal(resolveHeroSettingsForRender(settings({ layout: 'mag' }), tiers, false), null)
  })
  it('free studio with a PRO option on a free layout falls back to the theme hero', () => {
    assert.equal(resolveHeroSettingsForRender(settings({ pinOnScroll: true }), tiers, false), null)
  })
  it('PRO studio keeps everything', () => {
    const saved = settings({ layout: 'mag', transition: 'zoom', titleSize: 'lg' })
    assert.deepEqual(resolveHeroSettingsForRender(saved, tiers, true), saved)
  })
  it('admin flipping a layout to PRO takes it away from free studios immediately', () => {
    const saved = settings({ layout: 'split' })
    const flipped = { ...tiers, 'layout:split': 'pro' as const }
    assert.equal(resolveHeroSettingsForRender(saved, flipped, false), null)
    assert.deepEqual(proHeroOptionsInUse(saved, flipped), ['layout:split'])
  })
})

describe('withoutProHeroOptions', () => {
  const tiers = DEFAULT_HERO_OPTION_TIERS

  it('swaps a PRO layout for the first free one and resets PRO options, keeping free ones', () => {
    const result = withoutProHeroOptions(
      settings({ layout: 'mag', transition: 'zoom', titleSize: 'lg', speedSeconds: 8, showSecondaryCta: false }),
      tiers
    )
    assert.deepEqual(result, settings({ layout: 'cinema', speedSeconds: 8, showSecondaryCta: false }))
    assert.deepEqual(proHeroOptionsInUse(result!, tiers), [])
  })
  it('no free layout at all = back to the theme hero', () => {
    const allPro = Object.fromEntries(Object.keys(tiers).map((k) => [k, 'pro'])) as typeof tiers
    assert.equal(withoutProHeroOptions(settings({ layout: 'split' }), allPro), null)
  })
})
