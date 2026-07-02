import { NextResponse } from 'next/server'
import { getTestimonials } from '@/lib/actions/testimonials.actions'

export async function GET() {
  try {
    const testimonials = await getTestimonials()
    return NextResponse.json(testimonials)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'שגיאה' },
      { status: 500 }
    )
  }
}
