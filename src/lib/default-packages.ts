export const DEFAULT_PACKAGE_TITLES = ['בוטיק', 'פרימיום', 'לוקסוס'] as const

export type DefaultPackageSeed = {
  title: (typeof DEFAULT_PACKAGE_TITLES)[number]
  description: string
  price: number
  features: string[]
  is_featured: boolean
  sort_order: number
}

export const DEFAULT_PACKAGES: DefaultPackageSeed[] = [
  {
    title: 'בוטיק',
    description: 'הסשן הקצר והעדין',
    price: 1400,
    features: [
      '20 תמונות ערוכות בעבודת יד',
      'גלריה דיגיטלית פרטית',
      'ייעוץ סטיילינג לפני הסשן',
    ],
    is_featured: false,
    sort_order: 1,
  },
  {
    title: 'פרימיום',
    description: 'החבילה האהובה',
    price: 2200,
    features: [
      '40 תמונות ערוכות בעבודת יד',
      'אלבום מודפס קטן 20×20',
      'גלריה דיגיטלית פרטית',
      'שני שינויי תלבושת',
    ],
    is_featured: true,
    sort_order: 2,
  },
  {
    title: 'לוקסוס',
    description: 'החוויה השלמה',
    price: 3600,
    features: [
      '80 תמונות ערוכות בעבודת יד',
      'אלבום פיין-ארט יוקרתי',
      'סט של 3 הדפסות קיר ממוסגרות',
      'ליווי סטיילינג מלא',
    ],
    is_featured: false,
    sort_order: 3,
  },
]
