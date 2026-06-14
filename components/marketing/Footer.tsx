export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[--border] px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-sm text-[--muted] sm:flex-row">
        <span>Studio Gallery</span>
        <span>© כל הזכויות שמורות {year}</span>
      </div>
    </footer>
  )
}
