import { splitHighlightedPhrase } from '@/lib/about-headline'

export function AboutHeadlineLine1({ text }: { text: string }) {
  const commaIndex = text.indexOf(',')

  if (commaIndex >= 0) {
    return (
      <>
        {text.slice(0, commaIndex + 1)}{' '}
        <span className="font-light italic">{text.slice(commaIndex + 1).trim()}</span>
      </>
    )
  }

  return <>{text}</>
}

export function AboutHeadlineLine2({ text }: { text: string }) {
  const parts = splitHighlightedPhrase(text)

  return (
    <span className="mt-2 block">
      {parts.map((part, index) =>
        part.highlight ? (
          <span key={index} className="relative mr-3 inline-block">
            {part.text}
            <span className="theme-underline absolute -bottom-2 right-0 h-[5px] w-full rounded-full opacity-80" />
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  )
}
