/**
 * כותב ZIP טהור (ללא תלות חיצונית) במצב "store" — בלי דחיסה.
 * אידיאלי לתמונות JPEG/PNG/WebP שכבר דחוסות: מהיר, וזורם קובץ-קובץ
 * כך שרק תמונה אחת מוחזקת בזיכרון בכל רגע (לא כל ה-ZIP).
 *
 * הערה: מבנה ZIP קלאסי (ללא ZIP64) — מתאים לקבצים < 4GB ולפחות מ-65,535 קבצים.
 */

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

export type ZipEntry = { name: string; data: Uint8Array }

type CentralEntry = {
  nameBytes: Uint8Array
  crc: number
  size: number
  offset: number
}

function le16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value & 0xffff, true)
}

function le32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, true)
}

function localHeader(nameBytes: Uint8Array, crc: number, size: number): Uint8Array {
  const buf = new Uint8Array(30 + nameBytes.length)
  const view = new DataView(buf.buffer)
  le32(view, 0, 0x04034b50)
  le16(view, 4, 20) // version needed
  le16(view, 6, 0x0800) // UTF-8 filename flag
  le16(view, 8, 0) // method: store
  le16(view, 10, 0) // mod time
  le16(view, 12, 0) // mod date
  le32(view, 14, crc)
  le32(view, 18, size) // compressed size
  le32(view, 22, size) // uncompressed size
  le16(view, 26, nameBytes.length)
  le16(view, 28, 0) // extra length
  buf.set(nameBytes, 30)
  return buf
}

function centralHeader(entry: CentralEntry): Uint8Array {
  const buf = new Uint8Array(46 + entry.nameBytes.length)
  const view = new DataView(buf.buffer)
  le32(view, 0, 0x02014b50)
  le16(view, 4, 20) // version made by
  le16(view, 6, 20) // version needed
  le16(view, 8, 0x0800) // UTF-8 flag
  le16(view, 10, 0) // method
  le16(view, 12, 0) // mod time
  le16(view, 14, 0) // mod date
  le32(view, 16, entry.crc)
  le32(view, 20, entry.size)
  le32(view, 24, entry.size)
  le16(view, 28, entry.nameBytes.length)
  le16(view, 30, 0) // extra
  le16(view, 32, 0) // comment
  le16(view, 34, 0) // disk start
  le16(view, 36, 0) // internal attrs
  le32(view, 38, 0) // external attrs
  le32(view, 42, entry.offset)
  buf.set(entry.nameBytes, 46)
  return buf
}

function endOfCentralDirectory(
  count: number,
  centralSize: number,
  centralOffset: number
): Uint8Array {
  const buf = new Uint8Array(22)
  const view = new DataView(buf.buffer)
  le32(view, 0, 0x06054b50)
  le16(view, 4, 0) // disk number
  le16(view, 6, 0) // disk with central dir
  le16(view, 8, count)
  le16(view, 10, count)
  le32(view, 12, centralSize)
  le32(view, 16, centralOffset)
  le16(view, 20, 0) // comment length
  return buf
}

function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>()
  return names.map((raw) => {
    const name = raw.replace(/[\\/]+/g, '_').trim() || 'file'
    const lower = name.toLowerCase()
    const n = seen.get(lower) ?? 0
    seen.set(lower, n + 1)
    if (n === 0) return name
    const dot = name.lastIndexOf('.')
    if (dot <= 0) return `${name}-${n}`
    return `${name.slice(0, dot)}-${n}${name.slice(dot)}`
  })
}

/**
 * מקבל אסינכרון-מקור של קבצים ומחזיר ReadableStream של ה-ZIP.
 * מייצר קובץ אחד לכל קריאת pull כדי לכבד לחץ-חוזר (backpressure)
 * ולהחזיק בזיכרון תמונה אחת בכל רגע.
 */
export function createZipStream(
  source: AsyncIterable<ZipEntry>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const central: CentralEntry[] = []
  const iterator = source[Symbol.asyncIterator]()
  let offset = 0
  let finished = false

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next()

        if (!done && value) {
          const nameBytes = encoder.encode(value.name)
          const crc = crc32(value.data)
          const header = localHeader(nameBytes, crc, value.data.length)
          controller.enqueue(header)
          controller.enqueue(value.data)
          central.push({ nameBytes, crc, size: value.data.length, offset })
          offset += header.length + value.data.length
          return
        }

        if (finished) return
        finished = true

        const centralStart = offset
        let centralSize = 0
        for (const entry of central) {
          const header = centralHeader(entry)
          controller.enqueue(header)
          centralSize += header.length
        }
        controller.enqueue(
          endOfCentralDirectory(central.length, centralSize, centralStart)
        )
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}

export function safeZipName(name: string): string {
  return uniqueNames([name])[0]
}

export { uniqueNames }
