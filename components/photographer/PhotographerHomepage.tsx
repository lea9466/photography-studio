'use client'

import { useEffect, useState } from 'react'

interface Photographer {
  id: string
  name: string
  studio_name: string
  logo_url: string | null
  about_text: string | null
  stat_projects: number
  stat_clients: number
  stat_experience_years: number
  accent_color: string
  selected_theme: string
  hero_desktop_url: string | null
  hero_mobile_url: string | null
  about_image_url: string | null
  email: string | null
}

interface Gallery {
  id: string
  title: string
  slug: string | null
  preview_url: string | null
  created_at: string
}

interface Package {
  id: string
  name: string
  price_amount: number
  duration_text: string | null
  includes: string[]
  sort_order: number
  is_featured: boolean
}

interface PhotographerHomepageProps {
  photographer: Photographer
  galleries?: Gallery[]
  packages?: Package[]
}

export function PhotographerHomepage({ photographer, galleries = [], packages = [] }: PhotographerHomepageProps) {
  const [mounted, setMounted] = useState(false)
  const [html, setHtml] = useState('')

  useEffect(() => {
    setMounted(true)
    const themeMap: Record<string, string> = {
      'elegant': 'elegant',
      'modern': 'modern',
      'classic': 'classic',
      'bold': 'dark',
    }

    const theme = themeMap[photographer.selected_theme] || 'elegant'
    const generatedHtml = generateHomepageHTML(photographer, theme, galleries, packages)
    setHtml(generatedHtml)
  }, [photographer, galleries, packages])

  if (!mounted) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  if (!html) {
    return <div style={{ padding: '20px' }}>No HTML generated</div>
  }

  return (
    <iframe
      srcDoc={html}
      style={{ width: '100%', height: '100vh', border: 'none' }}
      title="Photographer Homepage"
    />
  )
}

function generateHomepageHTML(photographer: Photographer, theme: string, galleries: Gallery[], packages: Package[]): string {
  const {
    studio_name,
    about_text,
    stat_projects,
    stat_clients,
    stat_experience_years,
    accent_color,
    hero_desktop_url,
    hero_mobile_url,
    about_image_url,
    email,
  } = photographer

  const primaryColor = accent_color || '#B8953F'
  const heroImage = hero_desktop_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtc8vYozqzsyyaSs762LNJcnclKdmGuK6RBZsCh9_MldHQKMKggJGAHH3J5iuJgvcCH-Rg_dmsmWUY3qKjIC3VxudGLoH_zp5RlgbhaDLLX8vwYl3u79Wt3ndaPtlt1px4spTUAY7PfRDXX69fTMO-z2V5Ij-GinPBFta-y5hZS2_Zrz3Y4HDR0V-wWv6S5Xqk8ver8tRBpMGDwXazgy0yNIUdjM9KmyqMURhx9mQfOx2xIMXb69yEPxvlkXmYucFWaM5XR-U-KAw'
  const aboutImage = about_image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIq8lAwhbuZMrb5ZZ_F-ZyhFBSMxWhWNg7V-_a7q3NWQrpgsg9RqhbgcZcJiXVII6xbNapQk30LDSiiVCpM7XrGqYj1YlL3K_Y8xKZ7tqBxFqQoory1FYngx7ju_3XuDodAO_Nt0V8m8Hm_NtH8GnVKN3O3PGvDPlSuwxt8rFnJjOlVPFSJu7Kv81xtWup4oxTJZJvwL4TwYUps6nqbPhL22XF_WJkDiv0r0jFuN2887-7PiO9KEBAVS1OX75Z3uKuCScZ_TlTFOc'

  const studioName = studio_name || 'סטודיו גלריה'
  const aboutText = about_text || 'ב-Studio Gallery, אנו מאמינים שכל אישה נושאת בתוכה סיפור ייחודי הראוי להיות מונצח באמנות. הגישה שלנו משלבת צילום אופנה קלאסי עם רגישות דוקומנטרית מודרנית.'

  const statsProjects = stat_projects || 450
  const statsClients = stat_clients || 2000
  const statsYears = stat_experience_years || 12

  // Generate dynamic galleries HTML
  const galleriesHTML = galleries.length > 0 
    ? galleries.map((g, i) => `
        <div class="group relative overflow-hidden cursor-pointer">
          <img alt="${g.title}" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src="${g.preview_url || heroImage}"/>
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-lg">
            <p class="text-white font-headline text-2xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">${g.title}</p>
          </div>
        </div>
      `).join('')
    : ''

  // Generate dynamic packages HTML for each theme
  const generatePackagesHTML = (currentTheme: string) => {
    if (packages.length === 0) return ''
    
    return packages.map((pkg, i) => {
      const includesList = pkg.includes || [];
      const isFeatured = pkg.is_featured;
      
      if (currentTheme === 'elegant') {
        return `
        <div class="${isFeatured ? 'bg-white border-2 border-[--primary-accent]' : 'bg-white border border-outline-variant'} p-10 flex flex-col h-full reveal-on-scroll relative" style="direction: rtl !important; text-align: right !important;">
          ${isFeatured ? '<div class="absolute -top-3 right-4 bg-[--primary-accent] text-white px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full shadow-lg" style="direction: rtl !important;">הנמכרת ביותר</div>' : ''}
          <div class="text-center mb-8 ${isFeatured ? 'mt-2' : ''}" style="direction: rtl !important; text-align: right !important;">
            <h3 class="font-display text-3xl mb-2" style="direction: rtl !important; text-align: right !important; color: ${isFeatured ? 'var(--primary-accent)' : '#0F0F0D'};">${pkg.name}</h3>
            <div class="text-lg tracking-widest elegant-accent" style="direction: rtl !important; text-align: right !important; color: ${isFeatured ? 'var(--primary-accent)' : 'inherit'};">₪${pkg.price_amount}</div>
          </div>
          <div class="border-t ${isFeatured ? 'border-[--primary-accent]/20' : 'hairline-border'} pt-8 mb-10 flex-grow" style="direction: rtl !important; text-align: right !important;">
            <ul class="space-y-4 font-body text-base ${isFeatured ? 'text-on-surface-variant' : 'opacity-80'}" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">
              ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-4 w-full"><span class="material-symbols-outlined text-xl" style="color: ${isFeatured ? 'var(--primary-accent)' : 'inherit'};">check</span> <span>${item}</span></li>`).join('')}
            </ul>
          </div>
          <div class="mt-auto" style="direction: rtl !important; text-align: right !important;">
            <button class="w-full border border-[#0F0F0D] px-8 py-4 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all" style="direction: rtl !important; text-align: right !important;">תיאום שיחת ייעוץ</button>
          </div>
        </div>
      `;
      } else if (currentTheme === 'modern') {
        return `
        <div class="bg-white p-xl rounded-2xl modern-shadow border border-outline-variant flex flex-col gap-md transition-all hover:-translate-y-2 animate-reveal ${isFeatured ? 'border-2 border-primary' : ''}" style="direction: rtl !important; text-align: right !important;">
          ${isFeatured ? '<div class="absolute -top-4 right-1/2 translate-x-1/2 bg-primary text-white px-lg py-1 rounded-full text-xs font-bold uppercase tracking-wider" style="direction: rtl !important;">הנמכרת ביותר</div>' : ''}
          <div style="direction: rtl !important; text-align: right !important;">
            <h3 class="font-headline text-2xl font-bold" style="direction: rtl !important; text-align: right !important;">${pkg.name}</h3>
            <div class="flex items-baseline gap-xs mt-sm" style="direction: rtl !important; text-align: right !important;">
              <span class="font-headline text-3xl font-bold text-primary" style="direction: rtl !important;">₪${pkg.price_amount}</span>
            </div>
          </div>
          <ul class="flex flex-col gap-sm flex-grow" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">
            ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-sm w-full text-md"><span class="material-symbols-outlined text-primary text-xl">check_circle</span> <span>${item}</span></li>`).join('')}
          </ul>
          <button class="w-full py-md ${isFeatured ? 'bg-primary text-white rounded-lg font-bold btn-magnetic shadow-lg shadow-indigo-100' : 'border border-primary text-primary rounded-lg font-bold btn-magnetic hover:bg-primary/5'} transition-all" style="direction: rtl !important; text-align: right !important;">
            הזמינו עכשיו
          </button>
        </div>
      `;
      } else if (currentTheme === 'dark') {
        return `
        <div class="${isFeatured ? 'bg-background p-lg md:p-xl flex flex-col items-center text-center relative md:-translate-y-lg shadow-2xl' : 'bg-background p-lg md:p-xl transition-all flex flex-col items-center text-center shadow-sm hover:shadow-xl group border border-white/10'}" style="direction: rtl !important; text-align: right !important;">
          ${isFeatured ? '<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-lg py-xs font-label-sm uppercase tracking-widest" style="direction: rtl !important;">הנמכרת ביותר</div>' : ''}
          <span class="font-label-sm text-primary/60 mb-md tracking-widest uppercase" style="direction: rtl !important; text-align: right !important;">${isFeatured ? 'Professional' : 'Essential'}</span>
          <h3 class="font-headline-sm mb-sm text-on-surface" style="direction: rtl !important; text-align: right !important;">${pkg.name}</h3>
          <div class="text-[48px] lg:text-display-lg ${isFeatured ? 'text-primary' : 'text-on-surface'} mb-xl" style="direction: rtl !important; text-align: right !important;">₪${pkg.price_amount}</div>
          <ul class="space-y-md mb-xl w-full text-on-surface-variant font-body-md" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">
            ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="w-full border-b border-white/10 pb-sm">${item}</li>`).join('')}
          </ul>
          <button class="mt-auto w-full ${isFeatured ? 'bg-primary text-on-primary py-md font-label-sm uppercase tracking-widest hover:opacity-90 btn-fuchsia-transition' : 'border border-on-surface text-on-surface py-md font-label-sm uppercase tracking-widest hover:bg-on-surface hover:text-background btn-fuchsia-transition'}" style="direction: rtl !important; text-align: right !important;">
            ${isFeatured ? 'לבחירת החבילה' : 'הזמן עכשיו'}
          </button>
        </div>
      `;
      } else if (currentTheme === 'classic') {
        return `
        <div class="${isFeatured ? 'bg-surface-container-low border border-primary/30 p-xl flex flex-col items-center rounded-sm shadow-xl relative scale-105 z-10' : 'bg-surface border border-outline-variant/30 p-xl flex flex-col items-center rounded-sm hover:border-primary/50 transition-colors duration-500'}" style="direction: rtl !important; text-align: right !important;">
          ${isFeatured ? '<div class="absolute -top-3 bg-primary text-on-primary px-lg py-1 rounded-sm font-label-sm text-label-sm shadow-md uppercase tracking-wider" style="direction: rtl !important;">הנמכרת ביותר</div>' : ''}
          <h3 class="font-headline-sm text-headline-sm text-on-surface mb-xs" style="direction: rtl !important; text-align: right !important;">${pkg.name}</h3>
          <p class="font-body-md text-body-md text-on-surface-variant/60 mb-lg" style="direction: rtl !important; text-align: right !important;">${isFeatured ? 'החוויה המלאה' : 'לרגעים קטנים ומרגשים'}</p>
          <div class="text-4xl font-bold text-primary mb-xl flex items-baseline gap-1" dir="ltr" style="direction: ltr !important;"><span class="text-lg font-normal">₪</span>${pkg.price_amount}</div>
          <ul class="space-y-md mb-xl w-full border-t ${isFeatured ? 'border-primary/10' : 'border-outline-variant/20'} pt-lg" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">
            ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-start justify-start gap-md w-full"><span class="material-symbols-outlined text-primary mt-1">${isFeatured ? 'check_circle' : 'check'}</span> <span class="font-body-md text-body-md text-on-surface-variant">${item}</span></li>`).join('')}
          </ul>
          <button class="w-full mt-auto ${isFeatured ? 'bg-primary text-on-primary py-md rounded-sm font-label-sm text-label-sm hover:brightness-110 transition-all duration-300 shadow-md' : 'border border-primary/40 text-primary py-sm rounded-sm font-label-sm text-label-sm hover:bg-primary hover:text-on-primary transition-all duration-300'}" style="direction: rtl !important; text-align: right !important;">
            ${isFeatured ? 'בחירה בחבילה' : 'הזמנת חבילה'}
          </button>
        </div>
      `;
      }
      return '';
    }).join('');
  };

  // ELEGANT THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA
  const ElegantTheme = () => `
<!DOCTYPE html>
<html class="scroll-smooth" dir="rtl" lang="he">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@300;400;500;700;900&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "primary": "${primaryColor}",
                    "secondary": "#675c57",
                    "tertiary": "#81533f",
                    "background": "#FAFAF8",
                    "surface": "#fdf8f7",
                    "accent": "${primaryColor}",
                    "on-surface": "#1c1b1b",
                    "on-surface-variant": "#464742",
                    "outline": "#767871",
                    "outline-variant": "#c7c7c0",
                    "surface-container-low": "#f7f3f2",
                    "surface-container-high": "#ebe7e6",
                    "surface-container-highest": "#e5e2e1"
            },
            "borderRadius": {
                    "DEFAULT": "0px",
                    "lg": "0px",
                    "xl": "0px"
            },
            "spacing": {
                    "lg": "24px",
                    "margin-mobile": "16px",
                    "md": "16px",
                    "gutter": "24px",
                    "margin-desktop": "64px",
                    "xl": "32px"
            },
            "fontFamily": {
                    "display": ["Playfair Display", "serif"],
                    "body": ["Heebo", "sans-serif"],
                    "serif-hebrew": ["Frank Ruhl Libre", "serif"]
            }
          },
        },
      }
    </script>
<style>
        body {
            background-color: #FAFAF8;
            color: #0F0F0D;
            font-family: 'Heebo', sans-serif;
            overflow-x: hidden;
        }
        
        .elegant-accent { color: ${primaryColor}; }
        .elegant-bg-accent { background-color: ${primaryColor}; }
        .elegant-border-accent { border-color: ${primaryColor}; }
        
        .glass-hero {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .hairline-border {
            border: 1px solid rgba(15, 15, 13, 0.1);
        }

        .reveal-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reveal-on-scroll.active {
            opacity: 1;
            transform: translateY(0);
        }

        .image-reveal {
            overflow: hidden;
            position: relative;
        }
        .image-reveal img {
            transition: transform 1.8s cubic-bezier(0.2, 0, 0.2, 1);
            transform: scale(1.15);
        }
        .image-reveal.active img {
            transform: scale(1);
        }

        .material-symbols-outlined {
            font-variation-settings: 'wght' 200, 'opsz' 24;
        }

        @media (max-width: 1024px) {
            .tablet-stack {
                grid-template-columns: 1fr !important;
            }
        }
    </style>
</head>
<body class="selection:bg-[${primaryColor}] selection:text-white">
<nav class="fixed top-0 w-full z-50 bg-transparent transition-all duration-500 px-lg py-md flex flex-row-reverse justify-between items-center left-0 right-0 max-w-[1440px] mx-auto">
<div class="font-display text-2xl uppercase tracking-[0.2em] font-medium text-on-surface">
        ${studioName}
    </div>
<div class="hidden md:flex flex-row-reverse gap-xl items-center">
<a class="text-on-surface-variant hover:text-accent transition-colors text-sm uppercase tracking-widest" href="#about">אודות</a>
<a class="text-on-surface-variant hover:text-accent transition-colors text-sm uppercase tracking-widest" href="#gallery">גלריות</a>
<a class="text-on-surface-variant hover:text-accent transition-colors text-sm uppercase tracking-widest" href="#pricing">מחירון</a>
<a class="text-on-surface-variant hover:text-accent transition-colors text-sm uppercase tracking-widest" href="#testimonials">המלצות</a>
</div>
<button class="bg-[#0F0F0D] text-white px-8 py-2 text-xs uppercase tracking-widest hover:bg-accent transition-all active:scale-95">
        צור קשר
    </button>
</nav>
<main>
<section class="relative h-screen flex items-center justify-center overflow-hidden px-md md:px-margin-desktop reveal-on-scroll">
<div class="absolute inset-0 z-0 image-reveal active">
<img alt="סטודיו יוקרתי" class="w-full h-full object-cover" src="${heroImage}"/>
</div>
<div class="relative z-10 glass-hero p-xl md:p-24 max-w-4xl text-center backdrop-blur-md">
<h1 class="font-display text-4xl md:text-7xl mb-6 leading-[1.1] text-on-surface">
                אמנות הרגע <br/>
<span class="elegant-accent italic font-light">באוצרות אישית</span>
</h1>
<p class="font-body text-lg md:text-xl text-on-surface/70 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                ${aboutText}
            </p>
<div class="flex justify-center">
<button class="bg-[#0F0F0D] text-white px-12 py-4 text-xs uppercase tracking-[0.3em] hover:bg-accent transition-all duration-300">
                    צפי בגלריה
                </button>
</div>
</div>
</section>
<section class="px-margin-mobile md:px-margin-desktop py-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-xl border-y hairline-border reveal-on-scroll">
<div class="text-center">
<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${statsYears}</span>
<span class="text-xs uppercase tracking-widest opacity-60">שנות ניסיון</span>
</div>
<div class="text-center">
<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${statsClients}+</span>
<span class="text-xs uppercase tracking-widest opacity-60">סיפורי לקוחות</span>
</div>
<div class="text-center">
<span class="font-display text-5xl md:text-6xl elegant-accent block mb-2">${statsProjects}</span>
<span class="text-xs uppercase tracking-widest opacity-60">פרסי צילום</span>
</div>
</section>
<section class="px-margin-mobile md:px-margin-desktop py-32 max-w-7xl mx-auto reveal-on-scroll" id="about">
<div class="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
<div class="order-2 lg:order-1">
<h2 class="font-serif-hebrew text-4xl md:text-5xl mb-8 font-medium">החזון שלנו</h2>
<p class="font-body text-lg mb-6 leading-relaxed opacity-80">
                    ${aboutText}
                </p>
<p class="font-body text-base mb-10 opacity-60 leading-relaxed">
                    אנו לא רק מצלמים תמונות; אנו יוצרים חוויות. מהרגע שנכנסת לסטודיו ועד לקבלת האלבום היוקרתי, כל פרט מעוצב כדי לגרום לך להרגיש הגרסה הבטוחה והיפה ביותר של עצמך.
                </p>
<button class="border border-[#0F0F0D] px-10 py-3 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all duration-300">
                    הכירי את הצוות
                </button>
</div>
<div class="order-1 lg:order-2 image-reveal aspect-[4/5] shadow-2xl">
<img alt="צילום פורטרט" class="w-full h-full object-cover" src="${aboutImage}"/>
</div>
</div>
</section>
<section class="px-margin-mobile md:px-margin-desktop py-24 bg-white" id="gallery">
<div class="max-w-7xl mx-auto">
<div class="flex flex-row-reverse justify-between items-end mb-16 reveal-on-scroll">
<h2 class="font-serif-hebrew text-4xl md:text-5xl font-medium">קולקציות נבחרות</h2>
<a class="text-xs uppercase tracking-widest elegant-accent border-b border-accent pb-1 hover:opacity-70 transition-opacity" href="#">לכל הגלריות</a>
</div>
<div class="grid grid-cols-1 md:grid-cols-12 gap-gutter tablet-stack">
${galleries.length > 0 ? galleries.map((g, i) => `
<div class="${i === 0 ? 'md:col-span-8' : 'md:col-span-4'} group overflow-hidden reveal-on-scroll" style="transition-delay: ${i * 200}ms;">
<div class="image-reveal ${i === 0 ? 'aspect-video' : 'aspect-[3/4]'} cursor-pointer">
<img alt="${g.title}" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src="${g.preview_url || heroImage}"/>
</div>
<div class="py-6">
<h3 class="font-display text-2xl mb-1">${g.title}</h3>
<p class="text-xs uppercase tracking-widest opacity-40">2024 • דוקומנטרי אומנותי</p>
</div>
</div>
`).join('') : `
<div class="md:col-span-8 group overflow-hidden reveal-on-scroll">
<div class="image-reveal aspect-video cursor-pointer">
<img alt="קולקציית חתונה" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src="${heroImage}"/>
</div>
<div class="py-6">
<h3 class="font-display text-2xl mb-1">חתונות יוקרה</h3>
<p class="text-xs uppercase tracking-widest opacity-40">2024 • דוקומנטרי אומנותי</p>
</div>
</div>
<div class="md:col-span-4 group overflow-hidden reveal-on-scroll" style="transition-delay: 200ms;">
<div class="image-reveal aspect-[3/4] cursor-pointer">
<img alt="קולקציית פורטרט" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src="${aboutImage}"/>
</div>
<div class="py-6">
<h3 class="font-display text-2xl mb-1">פורטרט אישי</h3>
<p class="text-xs uppercase tracking-widest opacity-40">קולקציית סטודיו</p>
</div>
</div>
`}
</div>
</div>
</section>
<section class="bg-[#f2f1ef] py-32 px-margin-mobile md:px-margin-desktop" id="pricing">
<div class="mx-auto max-w-7xl">
<div class="text-center mb-16 reveal-on-scroll">
<h2 class="font-serif-hebrew text-4xl md:text-5xl font-medium mb-4">חבילות שירות</h2>
<p class="font-body opacity-60 italic">השקעה בזיכרונות שיישארו לנצח</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">${generatePackagesHTML('elegant')}</div>
</div>
</section>
<section class="py-32 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto" id="testimonials">
<div class="text-center mb-16 reveal-on-scroll">
<h2 class="font-serif-hebrew text-4xl md:text-5xl font-medium mb-4">מה לקוחות אומרות</h2>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-12">
<div class="p-10 border border-outline-variant flex flex-col justify-between reveal-on-scroll">
<div>
<div class="flex flex-row-reverse gap-1 text-accent mb-6">
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
</div>
<p class="font-body text-lg italic opacity-80 leading-relaxed mb-8">"חוויה מעצימה ומדהימה. הרגשתי בנוח מהרגע הראשון, והתוצאות עלו על כל דמיון."</p>
</div>
<div>
<h4 class="font-display text-xl mb-1">דניאל כהן</h4>
<p class="text-xs uppercase tracking-widest opacity-40">צילומי פורטרט</p>
</div>
</div>
<div class="p-10 border border-outline-variant flex flex-col justify-between reveal-on-scroll" style="transition-delay: 150ms;">
<div>
<div class="flex flex-row-reverse gap-1 text-accent mb-6">
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
</div>
<p class="font-body text-lg italic opacity-80 leading-relaxed mb-8">"הדיוק, הסבלנות והעין האמנותית של הסטודיו הם נדירים."</p>
</div>
<div>
<h4 class="font-display text-xl mb-1">רונית לוי</h4>
<p class="text-xs uppercase tracking-widest opacity-40">צילומי חתונה</p>
</div>
</div>
<div class="p-10 border border-outline-variant flex flex-col justify-between reveal-on-scroll" style="transition-delay: 300ms;">
<div>
<div class="flex flex-row-reverse gap-1 text-accent mb-6">
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
</div>
<p class="font-body text-lg italic opacity-80 leading-relaxed mb-8">"מקצועיות ללא פשרות. כל פריים מספר סיפור."</p>
</div>
<div>
<h4 class="font-display text-xl mb-1">מיה ארד</h4>
<p class="text-xs uppercase tracking-widest opacity-40">צילומי קמפיין</p>
</div>
</div>
</div>
</section>
<section class="py-32 px-margin-mobile md:px-margin-desktop bg-[#1c1b1b] text-white reveal-on-scroll pb-48">
<div class="max-w-4xl mx-auto">
<div class="text-center mb-16">
<h2 class="font-serif-hebrew text-4xl md:text-5xl mb-4">צרי קשר</h2>
<p class="opacity-60 font-light">נשמח לשמוע ממך ולתאם את חווית הצילום המושלמת עבורך.</p>
</div>
${email ? `
<form action="mailto:${email}" method="post" enctype="text/plain" class="grid grid-cols-1 md:grid-cols-2 gap-10">
<div class="space-y-2">
<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">שם מלא</label>
<input name="name" class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white" placeholder="השם שלך" type="text"/>
</div>
<div class="space-y-2">
<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">אימייל</label>
<input name="email" class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white" placeholder="your@email.com" type="email"/>
</div>
<div class="space-y-2">
<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">טלפון</label>
<input name="phone" class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white" placeholder="050-0000000" type="tel"/>
</div>
<div class="space-y-2">
<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">נושא הפנייה</label>
<select name="subject" class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white/60">
<option class="bg-[#1c1b1b]">צילומי פורטרט</option>
<option class="bg-[#1c1b1b]">צילומי חתונה</option>
<option class="bg-[#1c1b1b]">צילומי קמפיין</option>
<option class="bg-[#1c1b1b]">אחר</option>
</select>
</div>
<div class="md:col-span-2 space-y-2">
<label class="text-[10px] uppercase tracking-[0.2em] opacity-40">הודעה</label>
<textarea name="message" class="w-full bg-transparent border-b border-white/20 focus:border-accent outline-none py-3 px-1 transition-colors font-body text-white min-h-[120px] resize-none" placeholder="איך נוכל לעזור?"></textarea>
</div>
<div class="md:col-span-2 flex justify-center mt-6">
<button type="submit" class="elegant-bg-accent text-white px-16 py-4 text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-300">
                        שליחת הודעה
                    </button>
</div>
</form>
` : '<div class="text-center py-20 opacity-40"><p class="font-body text-lg">אין כתובת אימייל ליצירת קשר</p></div>'}
</div>
</section>
</main>
<footer class="bg-white py-12 px-margin-mobile md:px-margin-desktop border-t border-outline-variant pb-32">
<div class="max-w-7xl mx-auto flex flex-col md:flex-row-reverse justify-between items-center gap-8">
<div class="font-display text-xl uppercase tracking-widest text-on-surface">
            ${studioName}
        </div>
<div class="flex flex-row-reverse gap-8 text-xs uppercase tracking-widest opacity-40">
<a class="hover:text-accent transition-colors" href="#">תקנון</a>
<a class="hover:text-accent transition-colors" href="#">פרטיות</a>
<a class="hover:text-accent transition-colors" href="#">נגישות</a>
</div>
<div class="text-[10px] uppercase tracking-widest opacity-40">
            © 2024 ${studioName}. כל הזכויות שמורות.
        </div>
</div>
</footer>
<script>
    const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                const imgReveal = entry.target.querySelector('.image-reveal');
                if (imgReveal) imgReveal.classList.add('active');
            }
        });
    }, observerOptions);
    document.querySelectorAll('.reveal-on-scroll').forEach(el => revealObserver.observe(el));
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('nav');
        if (window.scrollY > 100) {
            nav.classList.add('bg-white/80', 'backdrop-blur-lg', 'shadow-sm', 'py-4');
            nav.classList.remove('bg-transparent', 'py-md');
        } else {
            nav.classList.remove('bg-white/80', 'backdrop-blur-lg', 'shadow-sm', 'py-4');
            nav.classList.add('bg-transparent', 'py-md');
        }
    });
</script>
</body>
</html>
  `;

  // MODERN THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA
  const ModernTheme = () => `
<!DOCTYPE html>
<html class="light" dir="rtl" lang="he">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${studioName} | סטודיו לצילום מודרני</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style>
        :root {
            --headline-font: 'Space Grotesk', 'Heebo', sans-serif;
        }
        body {
            font-family: 'Heebo', sans-serif;
            background-color: #F8FAFC;
            color: #0F172A;
            scroll-behavior: smooth;
        }
        .font-headline {
            font-family: var(--headline-font);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .modern-shadow {
            box-shadow: 0px 4px 20px rgba(15, 23, 42, 0.05);
        }
        
        @keyframes revealUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-reveal {
            animation: revealUp 0.6s cubic-bezier(0.2, 0, 0.2, 1) forwards;
            opacity: 0;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }

        .hover-scale {
            transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hover-scale:hover {
            transform: scale(1.02);
        }
        
        .btn-magnetic {
            transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .btn-magnetic:active {
            transform: scale(0.96);
        }

        .nav-glass {
            background: rgba(248, 250, 252, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "${primaryColor}",
                        background: "#F8FAFC",
                        "on-surface": "#0F172A",
                        "on-surface-variant": "#475569",
                        outline: "#94a3b8",
                        "outline-variant": "#cbd5e1",
                        surface: "#ffffff",
                        "surface-dim": "#f1f5f9",
                        "surface-container": "#f1f5f9",
                        "surface-variant": "#e2e8f0",
                    },
                    borderRadius: {
                        "DEFAULT": "12px",
                        "lg": "12px",
                        "xl": "16px",
                        "2xl": "24px",
                        "full": "9999px"
                    },
                    spacing: {
                        "xl": "48px",
                        "md": "16px",
                        "xxl": "80px",
                        "lg": "24px"
                    }
                },
            },
        }
    </script>
</head>
<body class="bg-background text-on-surface overflow-x-hidden">
<nav class="fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent" id="navbar">
<div class="flex flex-row-reverse justify-between items-center px-lg py-md max-w-7xl mx-auto w-full">
<div class="flex items-center gap-sm">
<span class="font-headline text-2xl font-bold text-on-surface">${studioName}</span>
</div>
<div class="hidden md:flex flex-row-reverse gap-xl items-center">
<a class="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#about">אודות</a>
<a class="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#portfolio">גלריות</a>
<a class="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#pricing">מחירון</a>
</div>
<a class="bg-primary text-white px-lg py-sm rounded-lg text-sm font-bold btn-magnetic hover:shadow-lg transition-all" href="#contact">
            צור קשר
        </a>
</div>
</nav>
<main class="pt-xxl">
<section class="max-w-7xl mx-auto px-lg py-xxl grid grid-cols-1 md:grid-cols-2 gap-xl items-center" id="about">
<div class="flex flex-col gap-md order-2 md:order-1 animate-reveal">
<h1 class="font-headline text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
                אמנות הרגע <br/><span class="text-primary">בצורה מודרנית</span>
</h1>
<p class="text-lg md:text-xl text-on-surface-variant max-w-xl leading-relaxed">
                ${aboutText}
            </p>
<div class="flex flex-wrap gap-md pt-md">
<button class="bg-primary text-white px-xl py-md rounded-lg text-lg font-bold btn-magnetic hover:shadow-xl shadow-indigo-200 transition-all">
                    התחילו עכשיו
                </button>
<button class="border border-outline text-on-surface px-xl py-md rounded-lg text-lg font-bold btn-magnetic hover:bg-surface-variant transition-all">
                    לצפייה בגלריה
                </button>
</div>
</div>
<div class="relative order-1 md:order-2 animate-reveal delay-100">
<div class="aspect-square rounded-2xl overflow-hidden modern-shadow hover-scale group">
<img alt="סטודיו לצילום מקצועי" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="${heroImage}"/>
</div>
<div class="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-2xl -z-10"></div>
</div>
</section>
<section class="max-w-7xl mx-auto px-lg py-xxl">
<div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
<div class="bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal hover-scale">
<span class="material-symbols-outlined text-primary text-5xl">photo_camera</span>
<h3 class="font-headline text-4xl font-bold text-on-surface">${statsProjects}+</h3>
<p class="text-on-surface-variant font-medium">פרויקטים שהושלמו</p>
</div>
<div class="bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal delay-100 hover-scale">
<span class="material-symbols-outlined text-primary text-5xl">groups</span>
<h3 class="font-headline text-4xl font-bold text-on-surface">${statsClients}+</h3>
<p class="text-on-surface-variant font-medium">לקוחות מרוצים</p>
</div>
<div class="bg-white p-xl rounded-2xl modern-shadow flex flex-col items-center text-center gap-sm animate-reveal delay-200 hover-scale">
<span class="material-symbols-outlined text-primary text-5xl">military_tech</span>
<h3 class="font-headline text-4xl font-bold text-on-surface">${statsYears}</h3>
<p class="text-on-surface-variant font-medium">פרסי עיצוב וצילום</p>
</div>
</div>
</section>
<section class="py-xxl max-w-7xl mx-auto px-lg" id="portfolio">
<div class="flex flex-row-reverse justify-between items-end mb-xl gap-md animate-reveal">
<div class="text-right">
<h2 class="font-headline text-4xl font-bold mb-xs">העבודות האחרונות שלנו</h2>
<p class="text-on-surface-variant">מבט קצר אל הרגעים שתפסנו לאחרונה</p>
</div>
<button class="text-primary font-bold flex items-center gap-xs hover:gap-sm transition-all group">
<span class="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                כל הגלריות
            </button>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-md items-start">
<div class="grid grid-cols-1 sm:grid-cols-2 gap-md h-full">
${galleries.length > 0 ? galleries.slice(0, 3).map((g, i) => `
<div class="${i === 2 ? 'col-span-1 sm:col-span-2 aspect-video' : 'aspect-square'} rounded-xl overflow-hidden group relative animate-reveal" style="animation-delay: ${i * 100}ms;">
<img alt="${g.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="${g.preview_url || heroImage}"/>
</div>
`).join('') : `
<div class="aspect-square rounded-xl overflow-hidden group relative animate-reveal">
<img alt="נוף אדריכלי מינימליסטי" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="${heroImage}"/>
</div>
<div class="aspect-square rounded-xl overflow-hidden group relative animate-reveal delay-100">
<img alt="פורטרט מעוצב" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="${aboutImage}"/>
</div>
<div class="col-span-1 sm:col-span-2 aspect-video rounded-xl overflow-hidden group relative animate-reveal delay-200">
<img alt="נוף טבע" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="${heroImage}"/>
</div>
`}
</div>
<div class="h-full animate-reveal delay-300">
<div class="rounded-xl overflow-hidden h-[400px] md:h-[600px] group relative">
<img alt="צילום חתונה" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="${galleries.length > 0 ? galleries[0]?.preview_url || heroImage : heroImage}"/>
<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-lg">
<p class="text-white font-headline text-2xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">${galleries.length > 0 ? galleries[0].title : 'חתונת שיש מודרנית'}</p>
</div>
</div>
</div>
</div>
</section>
<section class="bg-surface-dim py-xxl" id="pricing">
<div class="max-w-7xl mx-auto px-lg">
<div class="text-center mb-xl animate-reveal">
<h2 class="font-headline text-4xl font-bold text-on-surface">חבילות הצילום שלנו</h2>
<p class="text-on-surface-variant">בחרו את החבילה המתאימה ליותר עבורכם</p>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-xl">${generatePackagesHTML('modern')}</div>
</div>
</section>
<section class="py-xxl max-w-7xl mx-auto px-lg">
<h2 class="font-headline text-4xl font-bold text-center mb-xl animate-reveal">מה הלקוחות אומרים</h2>
<div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
<div class="bg-white p-xl rounded-2xl border border-outline-variant italic text-lg flex gap-md animate-reveal hover-scale modern-shadow">
<span class="material-symbols-outlined text-primary text-5xl opacity-30">format_quote</span>
<div>
                    "החוויה עם סטודיו גלרי הייתה מדהימה. הם הצליחו לתפוס את האווירה בדיוק כפי שחלמנו. התמונות פשוט יצאו מושלמות."
                    <div class="not-italic mt-md font-bold text-on-surface">מיכל ורוני אברהם</div>
</div>
</div>
<div class="bg-white p-xl rounded-2xl border border-outline-variant italic text-lg flex gap-md animate-reveal delay-100 hover-scale modern-shadow">
<span class="material-symbols-outlined text-primary text-5xl opacity-30">format_quote</span>
<div>
                    "סטודיו מקצועי ברמות הגבוהות ביותר. השירות היה אדיב והתוצאה הסופית עלתה על כל הציפיות שלנו. מומלץ בחום!"
                    <div class="not-italic mt-md font-bold text-on-surface">יונתן כהן, הייטקיסט</div>
</div>
</div>
</div>
</section>
<section class="max-w-7xl mx-auto px-lg mb-xxl pb-[120px]" id="contact">
<div class="bg-primary rounded-2xl p-xl md:p-xxl text-white animate-reveal">
<div class="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
<div class="max-w-md text-right">
<h2 class="font-headline text-4xl font-bold mb-sm text-white">צרו איתנו קשר</h2>
<p class="text-lg opacity-90 text-white mb-lg">השאירו פרטים ונחזור אליכם בהקדם לתיאום פגישת ייעוץ או סשן צילומים.</p>
<div class="flex flex-col gap-md">
<div class="flex items-center justify-start gap-sm">
<span class="material-symbols-outlined text-white">call</span>
<span class="text-white" dir="ltr">050-1234567</span>
</div>
<div class="flex items-center justify-start gap-sm">
<span class="material-symbols-outlined text-white">mail</span>
<span class="text-white">${email || 'hello@studiogallery.co.il'}</span>
</div>
<div class="flex items-center justify-start gap-sm">
<span class="material-symbols-outlined text-white">location_on</span>
<span class="text-white">תל אביב, ישראל</span>
</div>
</div>
</div>
<form class="flex flex-col gap-md w-full">
<div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
<div class="relative">
<input class="w-full bg-white/10 border border-white/20 rounded-lg px-lg py-md text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-right" id="contact_name" placeholder="שם מלא" type="text"/>
</div>
<div class="relative">
<input class="w-full bg-white/10 border border-white/20 rounded-lg px-lg py-md text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-right" id="contact_email" placeholder="אימייל" type="email"/>
</div>
</div>
<div class="relative">
<input class="w-full bg-white/10 border border-white/20 rounded-lg px-lg py-md text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-right" id="contact_phone" placeholder="טלפון" type="tel"/>
</div>
<div class="relative">
<textarea class="w-full bg-white/10 border border-white/20 rounded-lg px-lg py-md text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-right" id="contact_message" placeholder="הודעה" rows="3"></textarea>
</div>
<button class="bg-white text-primary px-xl py-md rounded-lg font-bold btn-magnetic hover:shadow-xl self-start transition-all" type="submit">
                        שליחת הודעה
                    </button>
</form>
</div>
</div>
</section>
</main>
<footer class="bg-surface-container border-t border-outline-variant w-full py-xl pb-[120px]">
<div class="flex flex-col md:flex-row-reverse justify-between items-center px-lg gap-md max-w-7xl mx-auto w-full">
<div class="flex flex-col items-center md:items-end gap-xs">
<span class="font-headline text-2xl font-bold text-primary">${studioName}</span>
<p class="text-on-surface-variant text-sm">צילום אמנותי למותגים ואנשים.</p>
</div>
<div class="flex flex-col sm:flex-row-reverse gap-lg items-center">
<a class="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">תקנון</a>
<a class="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">פרטיות</a>
<a class="text-on-surface-variant hover:text-primary transition-colors text-sm" href="#">נגישות</a>
</div>
<div class="text-on-surface-variant text-sm text-center">
            © 2024 ${studioName}. כל הזכויות שמורות.
        </div>
<div class="flex gap-md">
<a aria-label="שיתוף" class="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all btn-magnetic" href="#">
<span class="material-symbols-outlined text-xl">share</span>
</a>
<a aria-label="אימייל" class="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all btn-magnetic" href="#">
<span class="material-symbols-outlined text-xl">mail</span>
</a>
</div>
</div>
</footer>
<script>
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-reveal');
                entry.target.style.opacity = "1";
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    document.querySelectorAll('.animate-reveal').forEach(el => revealObserver.observe(el));
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (window.scrollY > 20) {
            nav.classList.add('nav-glass', 'shadow-sm', 'border-outline-variant');
            nav.classList.remove('border-transparent');
        } else {
            nav.classList.remove('nav-glass', 'shadow-sm', 'border-outline-variant');
            nav.classList.add('border-transparent');
        }
    });
    document.querySelectorAll('.btn-magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = \`translate(\${x * 0.12}px, \${y * 0.12}px)\`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = \`translate(0px, 0px)\`;
        });
    });
</script>
</body>
</html>
  `;

  // CLASSIC THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA
  const ClassicTheme = () => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${studioName} | צילום מקצועי</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Frank+Ruhl+Libre:wght@400;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<style>
        :root {
            --headline-font: 'Frank Ruhl Libre', serif;
        }
        body {
            font-family: 'Heebo', sans-serif;
            scroll-behavior: smooth;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .classic-overlay {
            background: linear-gradient(to top, rgba(181, 129, 106, 0.6) 0%, rgba(181, 129, 106, 0) 100%);
        }
        .reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reveal.active {
            opacity: 1;
            transform: translateY(0);
        }
        .stagger-item {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .reveal.active .stagger-item {
            opacity: 1;
            transform: translateY(0);
        }
        .stagger-item:nth-child(1) { transition-delay: 0.1s; }
        .stagger-item:nth-child(2) { transition-delay: 0.2s; }
        .stagger-item:nth-child(3) { transition-delay: 0.3s; }
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "surface-container-lowest": "#ffffff",
                      "on-error": "#ffffff",
                      "on-error-container": "#93000a",
                      "primary-fixed": "#ffdf93",
                      "on-surface-variant": "#5a504a",
                      "on-surface": "#2d2825",
                      "on-tertiary": "#ffffff",
                      "primary-container": "#f1e3da",
                      "on-primary": "#ffffff",
                      "background": "#FAF7F4",
                      "inverse-surface": "#34302e",
                      "surface-container-highest": "#e8e1da",
                      "surface-container-high": "#efe7df",
                      "surface-container": "#f4ede6",
                      "tertiary-fixed-dim": "#e7c365",
                      "inverse-primary": "#eec148",
                      "error": "#ba1a1a",
                      "on-tertiary-fixed-variant": "#594400",
                      "surface-container-low": "#faf3eb",
                      "on-background": "#2d2825",
                      "on-secondary": "#ffffff",
                      "on-secondary-fixed": "#261a00",
                      "surface-tint": "${primaryColor}",
                      "secondary-fixed-dim": "#d9c4a0",
                      "surface-dim": "#e1d9ce",
                      "secondary-fixed": "#f6e0bb",
                      "on-secondary-fixed-variant": "#50452d",
                      "inverse-on-surface": "#f8efe4",
                      "secondary": "#7a6a5e",
                      "surface": "#FAF7F4",
                      "on-primary-container": "#4e3325",
                      "primary": "${primaryColor}",
                      "tertiary-container": "#c9a74d",
                      "surface-variant": "#ede1cf",
                      "outline-variant": "#d1c6b4",
                      "surface-bright": "#FAF7F4",
                      "secondary-container": "#f1e3c8",
                      "tertiary": "#8c4a2d",
                      "tertiary-fixed": "#ffdbcf",
                      "on-primary-fixed-variant": "#594400",
                      "on-tertiary-container": "#351000",
                      "primary-fixed-dim": "#eec148",
                      "on-primary-fixed": "#241a00",
                      "on-secondary-container": "#241a00",
                      "error-container": "#ffdad6",
                      "on-tertiary-fixed": "#351000",
                      "outline": "#8a7d75"
              },
              "borderRadius": {
                      "DEFAULT": "4px",
                      "lg": "4px",
                      "xl": "4px",
                      "full": "9999px"
              },
              "spacing": {
                      "md": "16px",
                      "xl": "48px",
                      "lg": "24px",
                      "sm": "8px",
                      "xs": "4px",
                      "xxl": "80px"
              },
              "fontFamily": {
                      "body-lg": ["Heebo"],
                      "headline-sm": ["var(--headline-font)"],
                      "display-lg": ["var(--headline-font)"],
                      "display-lg-mobile": ["var(--headline-font)"],
                      "label-sm": ["Heebo"],
                      "headline-md": ["var(--headline-font)"],
                      "body-md": ["Heebo"]
              },
              "fontSize": {
                      "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
                      "headline-sm": ["26px", {"lineHeight": "1.4", "fontWeight": "600"}],
                      "display-lg": ["68px", {"lineHeight": "1.1", "letterSpacing": "-0.01em", "fontWeight": "700"}],
                      "display-lg-mobile": ["42px", {"lineHeight": "1.2", "fontWeight": "700"}],
                      "label-sm": ["13px", {"lineHeight": "1", "letterSpacing": "0.06em", "fontWeight": "500"}],
                      "headline-md": ["36px", {"lineHeight": "1.3", "fontWeight": "600"}],
                      "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}]
              }
            },
          },
        }
    </script>
</head>
<body class="bg-surface text-on-surface overflow-x-hidden">
<nav class="fixed top-0 w-full z-50 transition-all duration-700 border-b border-transparent" id="main-nav">
<div class="flex flex-row-reverse justify-between items-center px-lg py-md max-w-7xl mx-auto w-full">
<div class="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                ${studioName}
            </div>
<div class="hidden md:flex flex-row-reverse gap-xl items-center">
<a class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#about">אודות</a>
<a class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#galleries">גלריות</a>
<a class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#pricing">חבילות</a>
<a class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#testimonials">המלצות</a>
</div>
<button class="bg-primary text-on-primary px-lg py-sm rounded-sm font-label-sm text-label-sm hover:brightness-110 transition-all active:scale-95 shadow-sm">
                צור קשר
            </button>
</div>
</nav>
<section class="relative h-screen w-full flex items-center justify-center overflow-hidden reveal" id="hero">
<div class="absolute inset-0 z-0 scale-105">
<img alt="סטודיו צילום קלאסי" class="w-full h-full object-cover" src="${heroImage}"/>
<div class="absolute inset-0 bg-black/40"></div>
</div>
<div class="relative z-10 text-center px-md max-w-4xl text-white">
<span class="block font-label-sm text-label-sm text-white/80 tracking-widest mb-md uppercase">הבית לרגעים יפים</span>
<h1 class="font-display-lg text-display-lg-mobile md:text-display-lg mb-md leading-tight">אמנות הצילום במיטבה</h1>
<p class="font-body-lg text-body-lg text-white/90 mb-xl max-w-2xl mx-auto">תופסים את הקסם שקורה בין הרגעים, בסטייל קלאסי ומרגש.</p>
<a class="inline-block bg-primary text-on-primary px-xxl py-md rounded-sm font-label-sm text-label-sm hover:brightness-110 hover:-translate-y-1 transition-all shadow-lg active:scale-95" href="#contact">
                תיאום פגישה
            </a>
</div>
</section>
<section class="py-xxl max-w-7xl mx-auto px-lg reveal" id="about">
<div class="grid grid-cols-1 md:grid-cols-2 gap-xl md:gap-xxl items-center">
<div class="order-2 md:order-1 transform transition-transform duration-700">
<img alt="דיוקן צלמת" class="w-full aspect-[4/5] md:aspect-[3/4] object-cover rounded-sm shadow-xl" src="${aboutImage}"/>
</div>
<div class="order-1 md:order-2 space-y-lg">
<span class="font-label-sm text-label-sm text-primary uppercase tracking-wider">סיפור אישי</span>
<h2 class="font-headline-md text-headline-md text-on-surface">אודות הסטודיו</h2>
<div class="w-16 h-0.5 bg-primary/40"></div>
<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                    ${aboutText}
                </p>
<p class="font-body-md text-body-md text-on-surface-variant">
                    בסטודיו שלנו אנו יוצרים סביבה רגועה ונינוחה שמאפשרת לכם להיות מי שאתם באמת. התוצאה? זיכרונות ויזואליים שיישארו איתכם לנצח.
                </p>
<div class="pt-md">
<a class="font-label-sm text-label-sm text-primary flex items-center gap-2 group flex-row-reverse justify-end" href="#galleries">
<span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_back</span>
                        לצפייה בגלריות
                    </a>
</div>
</div>
</div>
</section>
<section class="bg-surface-container-low py-xxl reveal" id="galleries">
<div class="max-w-7xl mx-auto px-lg">
<div class="text-center mb-xl">
<h2 class="font-headline-md text-headline-md text-on-surface">עבודות נבחרות</h2>
<p class="font-body-md text-body-md text-on-surface-variant mt-sm">מבט אל הרגעים שהפכו לנצח</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
${galleries.length > 0 ? galleries.slice(0, 3).map((g, i) => `
<div class="group relative overflow-hidden rounded-sm cursor-pointer stagger-item shadow-sm transition-all duration-700">
<img alt="${g.title}" class="w-full aspect-square object-cover transition-transform duration-1000 group-hover:scale-105" src="${g.preview_url || heroImage}"/>
<div class="absolute inset-0 classic-overlay opacity-0 group-hover:opacity-100 transition-all duration-700 flex items-end p-lg">
<span class="text-white font-headline-sm text-headline-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-700">${g.title}</span>
</div>
</div>
`).join('') : `
<div class="group relative overflow-hidden rounded-sm cursor-pointer stagger-item shadow-sm transition-all duration-700">
<img alt="צילומי ניובורן" class="w-full aspect-square object-cover transition-transform duration-1000 group-hover:scale-105" src="${heroImage}"/>
<div class="absolute inset-0 classic-overlay opacity-0 group-hover:opacity-100 transition-all duration-700 flex items-end p-lg">
<span class="text-white font-headline-sm text-headline-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-700">צילומי ניובורן</span>
</div>
</div>
<div class="group relative overflow-hidden rounded-sm cursor-pointer stagger-item shadow-sm transition-all duration-700">
<img alt="צילומי משפחה" class="w-full aspect-square object-cover transition-transform duration-1000 group-hover:scale-105" src="${aboutImage}"/>
<div class="absolute inset-0 classic-overlay opacity-0 group-hover:opacity-100 transition-all duration-700 flex items-end p-lg">
<span class="text-white font-headline-sm text-headline-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-700">צילומי משפחה</span>
</div>
</div>
<div class="group relative overflow-hidden rounded-sm cursor-pointer stagger-item shadow-sm transition-all duration-700">
<img alt="צילומי חתונה" class="w-full aspect-square object-cover transition-transform duration-1000 group-hover:scale-105" src="${heroImage}"/>
<div class="absolute inset-0 classic-overlay opacity-0 group-hover:opacity-100 transition-all duration-700 flex items-end p-lg">
<span class="text-white font-headline-sm text-headline-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-700">צילומי חתונות</span>
</div>
</div>
`}
</div>
</div>
</section>
<section class="py-xxl max-w-7xl mx-auto px-lg reveal" id="pricing">
<div class="text-center mb-xl">
<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block mb-xs">השקעה ברגעי קסם</span>
<h2 class="font-headline-md text-headline-md text-on-surface">חבילות צילום</h2>
<div class="w-12 h-px bg-outline-variant mx-auto mt-md"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-lg lg:gap-xl items-stretch">${generatePackagesHTML('classic')}</div>
</section>
<section class="bg-surface-container-high py-xxl reveal" id="testimonials">
<div class="max-w-4xl mx-auto px-lg">
<div class="text-center mb-xl">
<h2 class="font-headline-md text-headline-md text-on-surface">לקוחות מספרים</h2>
</div>
<div class="space-y-lg">
<div class="bg-surface p-xl rounded-sm shadow-sm border border-outline-variant/20 text-center relative italic stagger-item">
<span class="material-symbols-outlined absolute -top-4 right-8 text-primary text-4xl opacity-30">format_quote</span>
<p class="font-body-lg text-body-lg text-on-surface-variant mb-lg leading-relaxed">
                        "החוויה בסטודיו הייתה מדהימה. ידעת להוציא מאיתנו את המיטב גם כשהיינו נבוכים מול המצלמה. התמונות יצאו פשוט עוצרות נשימה!"
                    </p>
<div class="font-label-sm text-label-sm text-primary font-bold">משפחת כהן, תל אביב</div>
</div>
<div class="bg-surface p-xl rounded-sm shadow-sm border border-outline-variant/20 text-center relative italic stagger-item">
<span class="material-symbols-outlined absolute -top-4 right-8 text-primary text-4xl opacity-30">format_quote</span>
<p class="font-body-lg text-body-lg text-on-surface-variant mb-lg leading-relaxed">
                        "צילומים ביום החתונה יכולים להיות מלחיצים, אבל איתך הכל הרגיש כל כך טבעי וזורם. תודה על הזיכרונות הכי יפים של החיים שלנו."
                    </p>
<div class="font-label-sm text-label-sm text-primary font-bold">מיכל ורוני, ירושלים</div>
</div>
</div>
</div>
</section>
<section class="bg-surface-container-low py-xxl reveal border-t border-outline-variant/10 pb-xxl pt-xxl mb-xl" id="contact">
<div class="max-w-7xl mx-auto px-lg">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-xl md:gap-xxl items-start lg:gap-xl lg:gap-xxl">
<div class="lg:col-span-5 space-y-lg">
<span class="font-label-sm text-label-sm text-primary uppercase tracking-widest block">צרו קשר</span>
<h2 class="font-headline-md text-headline-md text-on-surface">בואו ניצור זיכרונות יחד</h2>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-md">השאירו פרטים ואחזור אליכם בהקדם לתיאום פגישת היכרות נעימה, שבה נתכנן את הצילומים המושלמים עבורכם.</p>
<div class="space-y-md pt-lg">
<a class="flex items-center gap-md flex-row-reverse justify-end group transition-colors hover:text-primary" href="tel:050-1234567">
<span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">call</span>
<span class="font-body-md text-body-md" dir="ltr">050-1234567</span>
</a>
<a class="flex items-center gap-md flex-row-reverse justify-end group transition-colors hover:text-primary" href="mailto:${email || 'hello@studiogallery.co.il'}">
<span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">mail</span>
<span class="font-body-md text-body-md">${email || 'hello@studiogallery.co.il'}</span>
</a>
<div class="flex items-center gap-md flex-row-reverse justify-end">
<span class="material-symbols-outlined text-primary">location_on</span>
<span class="font-body-md text-body-md">מתחם האמנים, תל אביב</span>
</div>
</div>
</div>
<div class="lg:col-span-7">
<form class="bg-surface p-xl lg:p-xxl rounded-sm shadow-xl border border-outline-variant/20 stagger-item">
<div class="grid grid-cols-1 md:grid-cols-2 gap-lg mb-lg">
<div class="space-y-xs">
<label class="font-label-sm text-label-sm text-on-surface-variant block px-1">שם מלא</label>
<input class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 bg-surface px-sm py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-md" placeholder="ישראל ישראלי" required="" type="text"/>
</div>
<div class="space-y-xs">
<label class="font-label-sm text-label-sm text-on-surface-variant block px-1">טלפון ליצירת קשר</label>
<input class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 bg-surface px-sm py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-md" placeholder="050-0000000" required="" type="tel"/>
</div>
</div>
<div class="space-y-xs mb-lg">
<label class="font-label-sm text-label-sm text-on-surface-variant block px-1">כתובת אימייל</label>
<input class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 bg-surface px-sm py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 px-md" placeholder="example@email.com" required="" type="email"/>
</div>
<div class="space-y-xs mb-xl">
<label class="font-label-sm text-label-sm text-on-surface-variant block px-1">ספרו לי על האירוע שלכם</label>
<textarea class="w-full border-b border-x-0 border-t-0 border-outline-variant/40 bg-surface px-sm py-md focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/30 resize-none px-md" placeholder="איזה סוג צילומים אתם מחפשים?" required="" rows="4"></textarea>
</div>
<button class="w-full bg-primary text-on-primary py-md rounded-sm font-label-sm text-label-sm hover:brightness-110 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-md" type="submit">
                        שלח פנייה
<span class="material-symbols-outlined text-sm">send</span>
</button>
</form>
</div>
</div>
</div>
</section>
<footer class="bg-surface-container-highest border-t border-outline-variant/20 py-xl pb-xxl">
<div class="flex flex-col md:flex-row-reverse justify-between items-center px-lg gap-md max-w-7xl mx-auto w-full">
<div class="font-headline-md text-headline-md text-primary tracking-tight">
                ${studioName}
            </div>
<div class="flex flex-row-reverse gap-lg">
<a class="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">תקנון</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">פרטיות</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">נגישות</a>
</div>
<div class="font-body-md text-body-md text-on-surface/60">
                © 2024 ${studioName}. כל הזכויות שמורות.
        </div>
</div>
</footer>
<script>
        window.addEventListener('scroll', () => {
            const nav = document.getElementById('main-nav');
            if (window.scrollY > 80) {
                nav.classList.add('bg-surface/90', 'backdrop-blur-md', 'py-sm', 'border-outline-variant/20', 'shadow-sm');
                nav.classList.remove('py-md', 'border-transparent');
            } else {
                nav.classList.remove('bg-surface/90', 'backdrop-blur-md', 'py-sm', 'border-outline-variant/20', 'shadow-sm');
                nav.classList.add('py-md', 'border-transparent');
            }
        });
        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);
        document.querySelectorAll('.reveal').forEach(el => { observer.observe(el); });
        window.addEventListener('load', () => {
            document.querySelectorAll('.reveal').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight) {
                    el.classList.add('active');
                }
            });
        });
    </script>
</body>
</html>
  `;

  // DARK THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA
  const DarkTheme = () => `
<!DOCTYPE html>
<html class="dark" dir="rtl" lang="he">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;700;800&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style>
        :root {
            --headline-font: 'Space Grotesk', sans-serif;
            --accent-pink: ${primaryColor};
            --deep-charcoal: "#121217";
            --light-bg: "#FAFAFA";
        }
        body {
            background-color: var(--deep-charcoal);
            color: #F5F5F0;
            font-family: 'Heebo', sans-serif;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }
        .hero-clamp {
            font-size: clamp(3rem, 10vw, 7rem);
            line-height: 0.95;
            letter-spacing: -0.02em;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        ::-webkit-scrollbar {
            width: 4px;
        }
        ::-webkit-scrollbar-track {
            background: #121217;
        }
        ::-webkit-scrollbar-thumb {
            background: ${primaryColor};
        }
        .section-transition-light {
            background-color: #ffffff;
            color: var(--deep-charcoal);
        }
        @keyframes revealUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes revealScale {
            from { transform: scale(1.1); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .reveal-up {
            animation: revealUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .reveal-delay-1 { animation-delay: 0.2s; }
        .reveal-delay-2 { animation-delay: 0.4s; }
        .stagger-grid-item {
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-fuchsia-transition {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reveal-on-scroll {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-on-scroll.active {
            opacity: 1;
            transform: translateY(0);
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "${primaryColor}",
                        "on-primary": "#F5F5F0",
                        "background": "#121217",
                        "surface": "#1A1A22",
                        "light-surface": "#FAFAFA",
                        "on-surface": "#F5F5F0",
                        "on-surface-variant": "#B8B8C0",
                        "outline": "#F5F5F0",
                        "outline-variant": "#3D3D4D",
                        "surface-container-low": "#1E1E26",
                        "surface-dim": "#0D0D12"
                    },
                    borderRadius: {
                        "DEFAULT": "0px",
                        "lg": "0px",
                        "xl": "0px",
                        "full": "0px"
                    },
                    spacing: {
                        "xl": "64px",
                        "md": "20px",
                        "xxl": "120px",
                        "xs": "6px",
                        "sm": "12px",
                        "lg": "32px"
                    },
                    fontFamily: {
                        "headline-md": ["var(--headline-font)"],
                        "display-lg": ["var(--headline-font)"],
                        "headline-sm": ["var(--headline-font)"],
                        "body-md": ["Heebo"],
                        "label-sm": ["Heebo"],
                    },
                    fontSize: {
                        "headline-md": ["32px", {"lineHeight": "1.2", "fontWeight": "800"}],
                        "headline-sm": ["24px", {"lineHeight": "1.3", "fontWeight": "700"}],
                        "display-lg": ["64px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "800"}],
                        "body-md": ["17px", {"lineHeight": "1.7", "fontWeight": "400"}],
                        "label-sm": ["13px", {"lineHeight": "1", "letterSpacing": "0.08em", "fontWeight": "500"}]
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-background text-on-surface">
<nav class="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-white/10">
<div class="flex flex-row-reverse justify-between items-center px-lg py-md max-w-7xl mx-auto w-full">
<div class="font-headline-sm text-headline-sm text-on-surface tracking-tighter">
                STUDIO <span class="text-primary font-light">GALLERY</span>
</div>
<div class="hidden md:flex flex-row-reverse gap-xl items-center">
<a class="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm btn-fuchsia-transition" href="#about">אודות</a>
<a class="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm btn-fuchsia-transition" href="#gallery">גלריות</a>
<a class="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm btn-fuchsia-transition" href="#pricing">מחירון</a>
<a class="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm btn-fuchsia-transition" href="#testimonials">המלצות</a>
</div>
<button class="bg-primary text-on-primary px-lg py-sm font-label-sm text-label-sm border border-primary hover:bg-transparent hover:text-primary btn-fuchsia-transition active:scale-95">
                צור קשר
            </button>
</div>
</nav>
<main class="pt-20">
<section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
<div class="absolute inset-0 z-0">
<img class="w-full h-full object-cover grayscale opacity-40 scale-110 transition-transform duration-[3s] ease-out" data-alt="High-end architectural photograph of a minimalist space" id="hero-img" src="${heroImage}"/>
<div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background"></div>
</div>
<div class="relative z-10 container mx-auto px-lg text-center overflow-hidden">
<span class="text-primary font-label-sm uppercase tracking-[0.3em] mb-lg block opacity-0 reveal-up">Premium Photography</span>
<h1 class="hero-clamp font-extrabold uppercase text-on-surface mb-md opacity-0 reveal-up reveal-delay-1">
                    CAPTURING <br/> <span class="text-primary italic font-bold">GLAMOUR</span> REALITY
                </h1>
<p class="font-body-md text-body-md max-w-2xl mx-auto mb-xl opacity-0 reveal-up reveal-delay-2 text-on-surface-variant">
                    ${aboutText}
                </p>
<div class="flex flex-col sm:flex-row-reverse gap-lg justify-center items-center opacity-0 reveal-up reveal-delay-2">
<button class="bg-primary text-on-primary px-xxl py-md font-label-sm uppercase tracking-widest btn-fuchsia-transition hover:bg-primary/90">
                        צפו בגלריה
                    </button>
<button class="text-on-surface font-label-sm uppercase tracking-widest border-b border-on-surface/30 hover:border-primary btn-fuchsia-transition py-xs">
                        הסיפור שלנו
                    </button>
</div>
</div>
</section>
<section class="py-xl md:py-xxl container mx-auto px-lg reveal-on-scroll" id="about">
<div class="grid grid-cols-1 lg:grid-cols-2 gap-xl items-center">
<div class="relative group">
<div class="absolute -top-4 -right-4 w-full h-full border border-primary/30 z-0"></div>
<img class="relative z-10 w-full aspect-[4/5] object-cover grayscale brightness-90 hover:grayscale-0 transition-all duration-700" src="${aboutImage}"/>
</div>
<div class="lg:pr-xl">
<span class="text-primary font-label-sm tracking-[0.3em] block mb-sm uppercase">Legacy</span>
<h2 class="font-headline-md text-headline-md mb-lg">החזון שלנו הוא לתעד רגעים שחיים לנצח</h2>
<p class="font-body-md text-on-surface-variant mb-lg">
                        ${aboutText}
                    </p>
<p class="font-body-md text-on-surface-variant mb-xl">
                        הגישה שלנו מבוססת על יוקרה מאופקת ודיוק טכני, במטרה להעניק לכל לקוח חוויה אמנותית ייחודית ותוצאות שמעבר לציפיות.
                    </p>
<div class="grid grid-cols-2 gap-lg border-t border-white/10 pt-xl">
<div>
<div class="text-primary font-headline-sm mb-xs">${statsProjects}+</div>
<div class="font-label-sm uppercase tracking-widest text-on-surface/60">פרויקטים</div>
</div>
<div>
<div class="text-primary font-headline-sm mb-xs">${statsYears}</div>
<div class="font-label-sm uppercase tracking-widest text-on-surface/60">שנות ניסיון</div>
</div>
</div>
</div>
</div>
</section>
<section class="py-xl md:py-xxl container mx-auto px-lg reveal-on-scroll" id="gallery">
<div class="flex flex-row-reverse justify-between items-end mb-lg md:mb-xxl">
<div>
<span class="text-primary font-label-sm tracking-[0.2em] block mb-xs uppercase">Portfolio</span>
<h2 class="font-headline-md text-headline-md">תיק עבודות נבחר</h2>
</div>
<div class="hidden sm:block">
<button class="flex items-center gap-sm font-label-sm group text-on-surface-variant hover:text-primary btn-fuchsia-transition uppercase tracking-widest">
                        כל הגלריות
                        <span class="material-symbols-outlined group-hover:translate-x-[-8px] transition-transform">arrow_back</span>
</button>
</div>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md md:gap-lg sm:h-auto lg:h-[900px]">
<div class="sm:col-span-2 sm:row-span-2 relative group overflow-hidden bg-surface min-h-[400px] sm:min-h-[500px] lg:min-h-full">
<img class="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0" data-alt="High-contrast cinematic portrait" src="${galleries.length > 0 ? galleries[0]?.preview_url || heroImage : heroImage}"/>
<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-xl">
<div class="translate-y-4 group-hover:translate-y-0 transition-transform">
<h3 class="font-headline-sm text-on-primary mb-xs">${galleries.length > 0 ? galleries[0].title : 'פורטרטים אמנותיים'}</h3>
<p class="font-body-md text-on-primary/80">דיוק ורגש עם סטייל בלתי מתפשר.</p>
</div>
</div>
</div>
<div class="sm:col-span-2 lg:col-span-2 relative group overflow-hidden bg-surface min-h-[300px]">
<img class="w-full h-full object-cover grayscale brightness-75 transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0" data-alt="Minimalist architectural photograph" src="${galleries.length > 1 ? galleries[1]?.preview_url || heroImage : heroImage}"/>
</div>
<div class="relative group overflow-hidden bg-surface min-h-[300px]">
<img class="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0" data-alt="Camera lens detail" src="${galleries.length > 2 ? galleries[2]?.preview_url || heroImage : heroImage}"/>
</div>
<div class="relative group overflow-hidden bg-surface min-h-[300px]">
<img class="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0" data-alt="Minimalist landscape" src="${galleries.length > 3 ? galleries[3]?.preview_url || heroImage : heroImage}"/>
</div>
</div>
</section>
<section class="section-transition-light py-xl md:py-xxl reveal-on-scroll" id="pricing">
<div class="container mx-auto px-lg">
<div class="text-center mb-xl md:mb-xxl max-w-2xl mx-auto">
<span class="text-primary font-label-sm tracking-[0.2em] block mb-xs uppercase">Investment</span>
<h2 class="font-headline-md text-headline-md mb-md text-background">חבילות וצילום</h2>
<p class="text-background/60 font-body-md">אנחנו מציעים מגוון אפשרויות שיתאימו לצרכים האישיים והעסקיים שלכם, עם דגש על איכות בלתי מתפשרת.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-lg lg:gap-xl items-stretch">${generatePackagesHTML('dark')}</div>
</div>
</section>
<section class="py-xl md:py-xxl container mx-auto px-lg reveal-on-scroll" id="testimonials">
<div class="text-center mb-xl md:mb-xxl">
<span class="text-primary font-label-sm tracking-[0.3em] block mb-sm uppercase">Kind Words</span>
<h2 class="font-headline-md text-headline-md">מה הלקוחות שלנו אומרים</h2>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
<div class="p-lg bg-surface border border-white/5 relative">
<span class="material-symbols-outlined text-primary text-[48px] opacity-20 absolute top-4 left-4">format_quote</span>
<p class="font-body-md text-on-surface-variant mb-xl relative z-10 italic">"החוויה בסטודיו הייתה יוצאת דופן. המקצועיות והעין החדה לפרטים יצרו תמונות שלא האמנתי שניתן להפיק. פשוט וואו!"</p>
<div class="flex items-center gap-md">
<div class="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">מ</div>
<div>
<div class="font-label-sm uppercase tracking-widest">מיכל כהן</div>
<div class="text-[10px] text-on-surface-variant">מעצבת אופנה</div>
</div>
</div>
</div>
<div class="p-lg bg-surface border border-white/5 relative">
<span class="material-symbols-outlined text-primary text-[48px] opacity-20 absolute top-4 left-4">format_quote</span>
<p class="font-body-md text-on-surface-variant mb-xl relative z-10 italic">"חיפשתי סטודיו שידע להעביר את המסר העסקי שלי בצורה יוקרתית ונקייה. התוצאה הייתה מדויקת ומרשימה. ממליץ בחום."</p>
<div class="flex items-center gap-md">
<div class="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">א</div>
<div>
<div class="font-label-sm uppercase tracking-widest">אביב לוי</div>
<div class="text-[10px] text-on-surface-variant">מנכ"ל טכנולוגיה</div>
</div>
</div>
</div>
<div class="p-lg bg-surface border border-white/5 relative">
<span class="material-symbols-outlined text-primary text-[48px] opacity-20 absolute top-4 left-4">format_quote</span>
<p class="font-body-md text-on-surface-variant mb-xl relative z-10 italic">"הדיוק והאסתטיקה הם ברמה אחרת מכל מה שהכרתי. התמונות שקיבלתי הן יצירות אמנות של ממש."</p>
<div class="flex items-center gap-md">
<div class="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">ד</div>
<div>
<div class="font-label-sm uppercase tracking-widest">דנה שרון</div>
<div class="text-[10px] text-on-surface-variant">אמנית חזותית</div>
</div>
</div>
</div>
</div>
</section>
<section class="py-md md:py-lg bg-background text-on-surface overflow-hidden whitespace-nowrap border-y border-white/10">
<div class="inline-block animate-marquee font-headline-sm text-[20px] md:text-headline-sm uppercase tracking-[0.2em] opacity-30">
                ${studioName}   •   Fashion Editorial   •   Glamour Reality   •   High-End Photography   •   Visual Art   •   ${studioName}   •   Fashion Editorial   •   Glamour Reality   •
            </div>
<style>
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            </style>
</section>
<section class="py-xl md:py-xxl container mx-auto px-lg reveal-on-scroll">
<div class="max-w-4xl mx-auto text-center">
<span class="text-primary font-label-sm tracking-[0.3em] block mb-sm uppercase">Join the Studio</span>
<h2 class="font-headline-md text-headline-md mb-md">בואו ניצור משהו בלתי נשכח</h2>
<p class="font-body-md mb-xl text-on-surface-variant max-w-xl mx-auto opacity-70">השאירו פרטים ונחזור אליכם בהקדם לתיאום פגישת ייעוץ או צילומים.</p>
<form class="grid grid-cols-1 md:grid-cols-2 gap-lg max-w-2xl mx-auto text-right">
<div class="border-b border-outline-variant">
<input class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20" placeholder="שם מלא" required="" type="text"/>
</div>
<div class="border-b border-outline-variant">
<input class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20" placeholder="כתובת אימייל" required="" type="email"/>
</div>
<div class="border-b border-outline-variant">
<input class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20" placeholder="טלפון" type="tel"/>
</div>
<div class="border-b border-outline-variant">
<input class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20" placeholder="נושא" type="text"/>
</div>
<div class="md:col-span-2 border-b border-outline-variant">
<textarea class="w-full bg-transparent border-none focus:ring-0 text-on-surface font-body-md py-md px-sm placeholder:text-white/20 min-h-[120px]" placeholder="ההודעה שלך"></textarea>
</div>
<div class="md:col-span-2 flex justify-center mt-md">
<button class="bg-primary text-on-primary px-xxl py-md font-label-sm uppercase tracking-widest btn-fuchsia-transition hover:bg-primary/90 active:scale-95">
            שלח הודעה
        </button>
</div>
</form>
</div>
</section>
</main>
<footer class="bg-surface-dim border-t border-white/5 py-xl mt-xxl">
<div class="flex flex-col md:flex-row-reverse justify-between items-center px-lg gap-lg max-w-7xl mx-auto w-full">
<div class="font-headline-sm text-headline-sm text-on-surface tracking-tighter">
                STUDIO <span class="text-primary font-light">GALLERY</span>
</div>
<div class="flex flex-row-reverse gap-md lg:gap-xl">
<a class="text-on-surface-variant hover:text-primary btn-fuchsia-transition font-label-sm uppercase tracking-widest text-[10px] md:text-xs" href="#">תקנון</a>
<a class="text-on-surface-variant hover:text-primary btn-fuchsia-transition font-label-sm uppercase tracking-widest text-[10px] md:text-xs" href="#">פרטיות</a>
<a class="text-on-surface-variant hover:text-primary btn-fuchsia-transition font-label-sm uppercase tracking-widest text-[10px] md:text-xs" href="#">נגישות</a>
</div>
<div class="text-on-surface-variant font-body-md text-[10px] md:text-xs opacity-50">
                © 2024 Studio Gallery. כל הזכויות שמורות.
        </div>
</div>
</footer>
<script>
        window.addEventListener('load', () => {
            const heroImg = document.getElementById('hero-img');
            if(heroImg) {
                heroImg.classList.remove('scale-110');
                heroImg.classList.add('scale-100');
            }
            const revealOnScroll = () => {
                const reveals = document.querySelectorAll('.reveal-on-scroll');
                reveals.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const windowHeight = window.innerHeight;
                    if (rect.top < windowHeight * 0.85) {
                        el.classList.add('active');
                    }
                });
            };
            revealOnScroll();
        });
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroImage = document.querySelector('section img');
            if(heroImage) {
                heroImage.style.transform = \`translateY(\${scrolled * 0.25}px)\`;
            }
            const revealOnScroll = () => {
                const reveals = document.querySelectorAll('.reveal-on-scroll');
                reveals.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const windowHeight = window.innerHeight;
                    if (rect.top < windowHeight * 0.85) {
                        el.classList.add('active');
                    }
                });
            };
            revealOnScroll();
        });
    </script>
</body>
</html>
  `;

  // Return the appropriate theme HTML
  switch (theme) {
    case 'modern':
      return ModernTheme()
    case 'classic':
      return ClassicTheme()
    case 'dark':
      return DarkTheme()
    case 'elegant':
    default:
      return ElegantTheme()
  }
}
