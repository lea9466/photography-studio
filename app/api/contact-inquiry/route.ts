import { NextResponse } from 'next/server'
import { submitContactInquiry } from '@/lib/actions/contact.actions'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    await submitContactInquiry({
      photographerId: String(body.photographerId ?? ''),
      name: String(body.name ?? ''),
      email: String(body.email ?? ''),
      phone: body.phone ? String(body.phone) : undefined,
      subject: body.subject ? String(body.subject) : undefined,
      message: String(body.message ?? ''),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'שגיאה בשליחה' },
      { status: 400 }
    )
  }
}
