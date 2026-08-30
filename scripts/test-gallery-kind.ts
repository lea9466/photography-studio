import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  galleryKind,
  galleryKindColumns,
  isGalleryKind,
  GALLERY_KIND_LABELS,
} from '../lib/gallery-kind'

/**
 * A gallery's kind (private client gallery vs public showcase gallery) is
 * fixed at creation and the two are never interchangeable. These lock the
 * mapping both ways: deriving the kind of an existing row, and the fixed
 * columns each kind writes.
 */

test('galleryKind: a portfolio row is a showcase gallery', () => {
  assert.equal(galleryKind({ is_public: true, gallery_type: 'portfolio' }), 'showcase')
})

test('galleryKind: a selection row is a client gallery', () => {
  assert.equal(galleryKind({ is_public: false, gallery_type: 'selection' }), 'client')
})

test('galleryKind: keys off gallery_type, NOT is_public', () => {
  // A showcase gallery currently hidden from the site still has is_public:false
  // but is still a showcase gallery — its kind never changes.
  assert.equal(galleryKind({ is_public: false, gallery_type: 'portfolio' }), 'showcase')
  // A client gallery is never a showcase gallery whatever is_public says.
  assert.equal(galleryKind({ is_public: true, gallery_type: 'selection' }), 'client')
})

test('galleryKind: missing/null gallery_type defaults to client (the safe, private side)', () => {
  assert.equal(galleryKind({}), 'client')
  assert.equal(galleryKind({ is_public: null, gallery_type: null }), 'client')
})

test('galleryKindColumns: showcase always maps to public portfolio', () => {
  assert.deepEqual(galleryKindColumns('showcase'), {
    galleryType: 'portfolio',
    isPublic: true,
  })
})

test('galleryKindColumns: client always maps to private selection', () => {
  assert.deepEqual(galleryKindColumns('client'), {
    galleryType: 'selection',
    isPublic: false,
  })
})

test('galleryKindColumns: a client gallery can never come out public', () => {
  assert.equal(galleryKindColumns('client').isPublic, false)
})

test('isGalleryKind: accepts only the two known kinds', () => {
  assert.equal(isGalleryKind('client'), true)
  assert.equal(isGalleryKind('showcase'), true)
  assert.equal(isGalleryKind('portfolio'), false)
  assert.equal(isGalleryKind(undefined), false)
  assert.equal(isGalleryKind(null), false)
  assert.equal(isGalleryKind(''), false)
})

test('every kind has a Hebrew label', () => {
  assert.equal(typeof GALLERY_KIND_LABELS.client, 'string')
  assert.equal(typeof GALLERY_KIND_LABELS.showcase, 'string')
  assert.ok(GALLERY_KIND_LABELS.client.length > 0)
  assert.ok(GALLERY_KIND_LABELS.showcase.length > 0)
})

test('round-trip: columns produced for a kind derive back to the same kind', () => {
  for (const kind of ['client', 'showcase'] as const) {
    const cols = galleryKindColumns(kind)
    assert.equal(
      galleryKind({ is_public: cols.isPublic, gallery_type: cols.galleryType }),
      kind
    )
  }
})
