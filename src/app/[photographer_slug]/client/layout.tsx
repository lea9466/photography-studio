export default function ClientAreaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div data-client="true" className="min-h-screen text-foreground">
      {children}
    </div>
  )
}
