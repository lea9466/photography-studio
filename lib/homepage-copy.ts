import type { SiteLanguage } from '@/lib/site-language'

export type HomepageCopy = {
  sections: {
    collections: string
    recentPhotos: string
    selectedPortfolio: string
    faq: string
    faqSubtitle: string
    contact: string
    contactElegantSubtitle: string
    contactModernSubtitle: string
    contactClassicSubtitle: string
    contactDarkSubtitle: string
    contactClassicHeading: string
    contactDarkHeading: string
    contactDarkSubheading: string
    testimonialsKindWords: string
    modernGalleryTitle: string
    modernGallerySubtitle: string
    modernRecentPhotosSubtitle: string
    modernContactHeading: string
    classicSelectedWorks: string
    classicSelectedWorksSubtitle: string
    classicRecentPhotosEyebrow: string
    classicContactHeading: string
    darkContactHeading: string
  }
  stats: {
    yearsExperience: string
    happyClients: string
    portfolios: string
  }
  about: {
    label: string
    defaultTitle: string
    defaultAboutText: string
    modernDefaultTitleLine1: string
    modernDefaultTitleLine2: string
    darkDefaultTitle: string
  }
  hero: {
    premiumStudio: string
    viewGalleries: string
    viewGallery: string
    viewGalleryShort: string
    ourStory: string
    getStarted: string
    scheduleSession: string
    photographySuffix: string
  }
  packages: {
    bestSeller: string
    scheduleConsultation: string
    orderNow: string
    selectPackage: string
    orderPackage: string
    fullExperience: string
    smallMoments: string
  }
  contactForm: {
    fullName: string
    email: string
    phone: string
    city: string
    subject: string
    message: string
    tellAboutEvent: string
    placeholders: {
      name: string
      nameExample: string
      email: string
      phone: string
      city: string
      subject: string
      message: string
      messageHelp: string
      messageEvent: string
    }
    phoneContact: string
    emailAddress: string
    yourMessage: string
    sendInquiry: string
    submit: string
    submitting: string
    successTitle: string
    successBody: string
    submitError: string
    noEmail: string
    privacyBefore: string
    privacyLink: string
  }
  contactDetails: {
    phone: string
    email: string
    location: string
  }
  misc: {
    photographyAlt: string
    portraitAlt: string
    photographerPortraitAlt: string
    testimonialPage: string
  }
}

const HEBREW_COPY: HomepageCopy = {
  sections: {
    collections: 'קולקציות נבחרות',
    recentPhotos: 'תמונות אחרונות',
    selectedPortfolio: 'תיק עבודות נבחר',
    faq: 'שאלות נפוצות',
    faqSubtitle: 'מצאו תשובות לשאלות הנפוצות ביותר',
    contact: 'צרי קשר',
    contactElegantSubtitle: 'נשמח לשמוע ממך ולתאם את חווית הצילום המושלמת עבורך.',
    contactModernSubtitle:
      'השאירו פרטים ונחזור אליכם בהקדם לתיאום פגישת ייעוץ או סשן צילומים.',
    contactClassicSubtitle:
      'השאירו פרטים ואחזור אליכם בהקדם לתיאום פגישת היכרות נעימה, שבה נתכנן את הצילומים המושלמים עבורכם.',
    contactDarkSubtitle:
      'השאירו פרטים ונחזור אליכם בהקדם לתיאום פגישת ייעוץ או צילומים.',
    contactClassicHeading: 'צרו קשר',
    contactDarkHeading: 'Join the Studio',
    contactDarkSubheading: 'Contact',
    testimonialsKindWords: 'Kind Words',
    modernGalleryTitle: 'העבודות האחרונות שלנו',
    modernGallerySubtitle: 'מבט קצר אל הרגעים שתפסנו לאחרונה',
    modernRecentPhotosSubtitle: 'רגעים נבחרים מהעבודות שלנו',
    modernContactHeading: 'צרו איתנו קשר',
    classicSelectedWorks: 'עבודות נבחרות',
    classicSelectedWorksSubtitle: 'מבט אל הרגעים שהפכו לנצח',
    classicRecentPhotosEyebrow: 'רגעים נבחרים מהעבודות שלנו',
    classicContactHeading: 'בואו ניצור זיכרונות יחד',
    darkContactHeading: 'בואו ניצור משהו בלתי נשכח',
  },
  stats: {
    yearsExperience: 'שנות ניסיון',
    happyClients: 'לקוחות מרוצים',
    portfolios: 'תיקי עבודות',
  },
  about: {
    label: 'About · קצת עליי',
    defaultTitle: 'אודות הסטודיו',
    defaultAboutText: 'תופסים את הקסם שקורה בין הרגעים, בסטייל קלאסי ומרגש.',
    modernDefaultTitleLine1: 'אמנות הרגע',
    modernDefaultTitleLine2: 'בצורה מודרנית',
    darkDefaultTitle: 'החזון שלנו הוא לתעד רגעים שחיים לנצח',
  },
  hero: {
    premiumStudio: 'Premium Studio',
    viewGalleries: 'לצפייה בגלריות',
    viewGallery: 'לצפייה בגלריה',
    viewGalleryShort: 'צפו בגלריה',
    ourStory: 'הסיפור שלנו',
    getStarted: 'התחילו עכשיו',
    scheduleSession: 'תיאום פגישה',
    photographySuffix: 'צילום',
  },
  packages: {
    bestSeller: 'הנמכרת ביותר',
    scheduleConsultation: 'תיאום שיחת ייעוץ',
    orderNow: 'הזמינו עכשיו',
    selectPackage: 'בחירה בחבילה',
    orderPackage: 'הזמנת חבילה',
    fullExperience: 'החוויה המלאה',
    smallMoments: 'לרגעים קטנים ומרגשים',
  },
  contactForm: {
    fullName: 'שם מלא',
    email: 'אימייל',
    phone: 'טלפון',
    city: 'עיר',
    subject: 'נושא הפנייה',
    message: 'הודעה',
    tellAboutEvent: 'ספרו לי על האירוע שלכם',
    phoneContact: 'טלפון ליצירת קשר',
    emailAddress: 'כתובת אימייל',
    yourMessage: 'ההודעה שלך',
    sendInquiry: 'שלח פנייה',
    placeholders: {
      name: 'השם שלך',
      nameExample: 'ישראל ישראלי',
      email: 'your@email.com',
      phone: '050-0000000',
      city: 'תל אביב',
      subject: 'נושא הפנייה',
      message: 'הודעה',
      messageHelp: 'איך נוכל לעזור?',
      messageEvent: 'איזה סוג צילומים אתם מחפשים?',
    },
    submit: 'שליחת הודעה',
    submitting: 'שולח...',
    successTitle: 'הפנייה נשלחה בהצלחה ✓',
    successBody: 'ניצור איתך קשר בהקדם.',
    submitError: 'שגיאה בשליחה',
    noEmail: 'אין כתובת אימייל ליצירת קשר',
    privacyBefore: 'אני מסכימ/ה לשמירת המידע האישי שלי לצורך טיפול בפנייה , בהתאם ל',
    privacyLink: 'מדיניות הפרטיות',
  },
  contactDetails: {
    phone: 'טלפון',
    email: 'אימייל',
    location: 'מיקום',
  },
  misc: {
    photographyAlt: 'סטודיו צילום',
    portraitAlt: 'צילום פורטרט',
    photographerPortraitAlt: 'דיוקן צלמת',
    testimonialPage: 'עמוד תגובות',
  },
}

const ENGLISH_COPY: HomepageCopy = {
  sections: {
    collections: 'Selected Collections',
    recentPhotos: 'Recent Photos',
    selectedPortfolio: 'Selected Portfolio',
    faq: 'FAQ',
    faqSubtitle: 'Find answers to the most common questions',
    contact: 'Contact',
    contactElegantSubtitle:
      'We would love to hear from you and plan the perfect photography experience.',
    contactModernSubtitle:
      'Leave your details and we will get back to you soon to schedule a consultation or photo session.',
    contactClassicSubtitle:
      'Leave your details and I will get back to you soon for a friendly intro call to plan your perfect shoot.',
    contactDarkSubtitle:
      'Leave your details and we will get back to you soon to schedule a consultation or session.',
    contactClassicHeading: 'Contact Us',
    contactDarkHeading: 'Join the Studio',
    contactDarkSubheading: 'Contact',
    testimonialsKindWords: 'Kind Words',
    modernGalleryTitle: 'Our Latest Work',
    modernGallerySubtitle: 'A quick look at the moments we captured recently',
    modernRecentPhotosSubtitle: 'Selected moments from our work',
    modernContactHeading: 'Contact Us',
    classicSelectedWorks: 'Selected Works',
    classicSelectedWorksSubtitle: 'A glimpse at moments that became timeless',
    classicRecentPhotosEyebrow: 'Selected moments from our work',
    classicContactHeading: "Let's create memories together",
    darkContactHeading: "Let's create something unforgettable",
  },
  stats: {
    yearsExperience: 'Years of Experience',
    happyClients: 'Happy Clients',
    portfolios: 'Portfolios',
  },
  about: {
    label: 'About · A little about me',
    defaultTitle: 'About the Studio',
    defaultAboutText: 'Capturing the magic between moments with a classic, emotional style.',
    modernDefaultTitleLine1: 'The art of the moment',
    modernDefaultTitleLine2: 'in a modern way',
    darkDefaultTitle: 'Our vision is to document moments that live forever',
  },
  hero: {
    premiumStudio: 'Premium Studio',
    viewGalleries: 'View Galleries',
    viewGallery: 'View Gallery',
    viewGalleryShort: 'View Gallery',
    ourStory: 'Our Story',
    getStarted: 'Get Started',
    scheduleSession: 'Book a Session',
    photographySuffix: 'Photography',
  },
  packages: {
    bestSeller: 'Best Seller',
    scheduleConsultation: 'Schedule a Consultation',
    orderNow: 'Order Now',
    selectPackage: 'Select Package',
    orderPackage: 'Order Package',
    fullExperience: 'The full experience',
    smallMoments: 'For small, meaningful moments',
  },
  contactForm: {
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    city: 'City',
    subject: 'Subject',
    message: 'Message',
    tellAboutEvent: 'Tell me about your event',
    phoneContact: 'Phone',
    emailAddress: 'Email address',
    yourMessage: 'Your message',
    sendInquiry: 'Send Inquiry',
    placeholders: {
      name: 'Your name',
      nameExample: 'Jane Doe',
      email: 'your@email.com',
      phone: '050-0000000',
      city: 'Tel Aviv',
      subject: 'Subject',
      message: 'Message',
      messageHelp: 'How can we help?',
      messageEvent: 'What type of shoot are you looking for?',
    },
    submit: 'Send Message',
    submitting: 'Sending...',
    successTitle: 'Your message was sent successfully ✓',
    successBody: 'We will be in touch soon.',
    submitError: 'Failed to send message',
    noEmail: 'No contact email is configured',
    privacyBefore: 'I agree to the storage of my personal information for handling this inquiry, in accordance with the',
    privacyLink: 'Privacy Policy',
  },
  contactDetails: {
    phone: 'Phone',
    email: 'Email',
    location: 'Location',
  },
  misc: {
    photographyAlt: 'Photography studio',
    portraitAlt: 'Portrait photo',
    photographerPortraitAlt: 'Photographer portrait',
    testimonialPage: 'Testimonials page',
  },
}

export function getHomepageCopy(language: SiteLanguage): HomepageCopy {
  return language === 'en' ? ENGLISH_COPY : HEBREW_COPY
}

/** Text alignment for contact fields that follow page direction (name, subject, message, city). */
export function contactTextAlignClass(_language?: SiteLanguage): string {
  return 'text-start rtl:text-right'
}

/** Email/phone inputs: LTR typing, alignment follows page language. */
export function contactLtrFieldClass(_language?: SiteLanguage): string {
  return 'text-start rtl:text-right'
}

export function contactLtrDirAttr(): string {
  return 'dir="ltr"'
}
