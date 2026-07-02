'use client'

import { useEffect, useState } from 'react'

interface Photographer {
  id: string
  name: string
  studio_name: string
  logo_url: string | null
  about_text: string | null
  about_title: string | null
  about_subtitle: string | null
  about_description: string | null
  contact_card_title: string | null
  contact_card_description: string | null
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
  photographer_slug: string
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
      'dark': 'dark',
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

function underlineLastWord(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  const words = trimmed.split(/\s+/)
  if (words.length === 1) {
    return `<span class="about-title-underline">${trimmed}</span>`
  }
  const lastWord = words.pop()!
  return `${words.join(' ')} <span class="about-title-underline">${lastWord}</span>`
}

function generateHomepageHTML(photographer: Photographer, theme: string, galleries: Gallery[], packages: Package[]): string {
  const {
    name,
    studio_name,
    logo_url,
    about_text,
    about_title,
    about_subtitle,
    about_description,
    contact_card_title,
    contact_card_description,
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
  const heroMobileImage = hero_mobile_url || heroImage
  const aboutImage = about_image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIq8lAwhbuZMrb5ZZ_F-ZyhFBSMxWhWNg7V-_a7q3NWQrpgsg9RqhbgcZcJiXVII6xbNapQk30LDSiiVCpM7XrGqYj1YlL3K_Y8xKZ7tqBxFqQoory1FYngx7ju_3XuDodAO_Nt0V8m8Hm_NtH8GnVKN3O3PGvDPlSuwxt8rFnJjOlVPFSJu7Kv81xtWup4oxTJZJvwL4TwYUps6nqbPhL22XF_WJkDiv0r0jFuN2887-7PiO9KEBAVS1OX75Z3uKuCScZ_TlTFOc'

  const studioName = studio_name || 'סטודיו גלריה'
  const photographerName = name || 'אפרת כהן'
  const aboutText = about_text || 'ב-Studio Gallery, אנו מאמינים שכל אישה נושאת בתוכה סיפור ייחודי הראוי להיות מונצח באמנות. הגישה שלנו משלבת צילום אופנה קלאסי עם רגישות דוקומנטרית מודרנית.'
  const aboutTitle = about_title || ''
  const aboutSubtitle = about_subtitle || ''
  const aboutDescription = about_description || ''
  const contactCardTitle = contact_card_title || ''
  const contactCardDescription = contact_card_description || ''

  const statsProjects = stat_projects || 450
  const statsClients = stat_clients || 2000
  const statsYears = stat_experience_years || 12

  // Generate dynamic galleries HTML
  const galleriesHTML = galleries.length > 0
    ? galleries.map((g, i) => {
        const year = new Date(g.created_at).getFullYear()
        const galleryUrl = `/public-gallery/${g.id}`
        return `
        <div class="group relative overflow-hidden">
          <img alt="${g.title}" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src="${g.preview_url}"/>
          <div class="absolute inset-0 bg-black/40 flex items-end p-lg">
            <div class="w-full">
              <p class="text-white font-headline text-2xl">${g.title}</p>
              <p class="text-white/80 text-sm mt-1">${year}</p>
              <button onclick="window.parent.postMessage({type: 'navigate', url: '${galleryUrl}'}, '*')" class="mt-4 bg-white text-black px-6 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors">
                צפה בגלריה
              </button>
            </div>
          </div>
        </div>
      `
      }).join('')
    : ''

  // Generate dynamic packages HTML for each theme
  const generatePackagesHTML = (currentTheme: string) => {
    if (packages.length === 0) return ''
    
    return packages.map((pkg, i) => {
      const includesList = pkg.includes || [];
      const isFeatured = pkg.is_featured;
      
      if (currentTheme === 'elegant') {
        return `
        <div class="${isFeatured ? 'bg-white border-2' : 'bg-white border border-outline-variant'} p-10 flex flex-col h-full reveal-on-scroll relative" style="direction: rtl !important; text-align: center !important; ${isFeatured ? `border-color: ${primaryColor};` : ''}">
          ${isFeatured ? `<div class="absolute -top-3 left-1/2 -translate-x-1/2 text-white px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full shadow-lg" style="direction: rtl !important; background-color: ${primaryColor};">הנמכרת ביותר</div>` : ''}
          <div class="text-center mb-8 ${isFeatured ? 'mt-2' : ''}" style="direction: rtl !important; text-align: center !important;">
            <h3 class="font-display text-3xl mb-2" style="direction: rtl !important; text-align: center !important; color: ${isFeatured ? primaryColor : '#0F0F0D'};">${pkg.name}</h3>
            <div class="text-lg tracking-widest elegant-accent" style="direction: rtl !important; text-align: center !important; color: ${isFeatured ? primaryColor : 'inherit'};">₪${pkg.price_amount}</div>
          </div>
          <div class="border-t pt-8 mb-10 flex-grow" style="direction: rtl !important; text-align: center !important; ${isFeatured ? `border-color: ${primaryColor}20;` : 'border-color: rgba(15, 15, 13, 0.1);'}">
            <div class="mx-auto w-fit" style="direction: rtl !important;">
              <ul class="space-y-4 font-body text-base ${isFeatured ? 'text-on-surface-variant' : 'opacity-80'}" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">
                ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-4 w-full"><span class="material-symbols-outlined text-xl" style="color: ${isFeatured ? primaryColor : 'inherit'};">check</span> <span>${item}</span></li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="mt-auto" style="direction: rtl !important; text-align: center !important;">
            <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="w-full border border-[#0F0F0D] px-8 py-4 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all" style="direction: rtl !important; text-align: center !important;">תיאום שיחת ייעוץ</button>
          </div>
        </div>
      `;
      } else if (currentTheme === 'modern') {
        return `
        <div class="bg-white p-xl rounded-2xl modern-shadow border border-outline-variant flex flex-col gap-md transition-all hover:-translate-y-2 animate-reveal ${isFeatured ? 'border-2 border-primary' : ''}" style="direction: rtl !important; text-align: center !important;">
          ${isFeatured ? '<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-lg py-1 rounded-full text-xs font-bold uppercase tracking-wider" style="direction: rtl !important;">הנמכרת ביותר</div>' : ''}
          <div style="direction: rtl !important; text-align: center !important;">
            <h3 class="font-headline text-2xl font-bold" style="direction: rtl !important; text-align: center !important;">${pkg.name}</h3>
            <div class="flex items-baseline gap-xs mt-sm justify-center" style="direction: rtl !important; text-align: center !important;">
              <span class="font-headline text-3xl font-bold text-primary" style="direction: rtl !important;">₪${pkg.price_amount}</span>
            </div>
          </div>
          <div class="mx-auto w-fit flex-grow my-lg" style="direction: rtl !important;">
            <ul class="flex flex-col gap-md" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">
              ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-sm text-md"><span class="material-symbols-outlined text-primary text-xl">check_circle</span> <span>${item}</span></li>`).join('')}
            </ul>
          </div>
          <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="w-full py-md ${isFeatured ? 'bg-primary text-white rounded-lg font-bold btn-magnetic shadow-lg shadow-indigo-100' : 'border border-primary text-primary rounded-lg font-bold btn-magnetic hover:bg-primary/5'} transition-all" style="direction: rtl !important; text-align: center !important;">
            הזמינו עכשיו
          </button>
        </div>
      `;
      } else if (currentTheme === 'dark') {
        return `
        <div class="${isFeatured ? 'bg-background p-lg md:p-xl flex flex-col items-center text-center relative md:-translate-y-lg shadow-2xl' : 'bg-background p-lg md:p-xl transition-all flex flex-col items-center text-center shadow-sm hover:shadow-xl group border border-white/10'}" style="direction: rtl !important; text-align: center !important;">
          ${isFeatured ? '<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-lg py-xs font-label-sm uppercase tracking-widest" style="direction: rtl !important;">הנמכרת ביותר</div>' : ''}
          <span class="font-label-sm text-primary/60 mb-md tracking-widest uppercase" style="direction: rtl !important; text-align: center !important;">${isFeatured ? 'Professional' : 'Essential'}</span>
          <h3 class="font-headline-sm mb-sm text-on-surface" style="direction: rtl !important; text-align: center !important;">${pkg.name}</h3>
          <div class="text-[48px] lg:text-display-lg ${isFeatured ? 'text-primary' : 'text-on-surface'} mb-xl" style="direction: rtl !important; text-align: center !important;">₪${pkg.price_amount}</div>
          <div class="mx-auto w-fit mb-xl" style="direction: rtl !important;">
            <ul class="space-y-md text-on-surface-variant font-body-md" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">
              ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-md w-full border-b border-white/10 pb-sm"><span class="material-symbols-outlined text-primary">check_circle</span> <span>${item}</span></li>`).join('')}
            </ul>
          </div>
          <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="mt-auto w-full ${isFeatured ? 'bg-primary text-on-primary py-md font-label-sm uppercase tracking-widest hover:opacity-90 btn-fuchsia-transition' : 'border border-on-surface text-on-surface py-md font-label-sm uppercase tracking-widest hover:bg-on-surface hover:text-background btn-fuchsia-transition'}" style="direction: rtl !important; text-align: center !important;">
            ${isFeatured ? 'לבחירת החבילה' : 'הזמן עכשיו'}
          </button>
        </div>
      `;
      } else if (currentTheme === 'classic') {
        return `
        <div class="${isFeatured ? 'bg-surface-container-low border border-primary/30 p-xl flex flex-col items-center rounded-sm shadow-xl relative scale-105 z-10' : 'bg-surface border border-outline-variant/30 p-xl flex flex-col items-center rounded-sm hover:border-primary/50 transition-colors duration-500'}" style="direction: rtl !important; text-align: center !important;">
          ${isFeatured ? '<div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-lg py-1 rounded-sm font-label-sm text-label-sm shadow-md uppercase tracking-wider" style="direction: rtl !important;">הנמכרת ביותר</div>' : ''}
          <h3 class="font-headline-sm text-headline-sm text-on-surface mb-xs" style="direction: rtl !important; text-align: center !important;">${pkg.name}</h3>
          <p class="font-body-md text-body-md text-on-surface-variant/60 mb-lg" style="direction: rtl !important; text-align: center !important;">${isFeatured ? 'החוויה המלאה' : 'לרגעים קטנים ומרגשים'}</p>
          <div class="text-4xl font-bold text-primary mb-xl flex items-baseline gap-1 justify-center" dir="ltr" style="direction: ltr !important;"><span class="text-lg font-normal">₪</span>${pkg.price_amount}</div>
          <div class="mx-auto w-fit mb-xl border-t ${isFeatured ? 'border-primary/10' : 'border-outline-variant/20'} pt-lg" style="direction: rtl !important;">
            <ul class="space-y-md" style="direction: rtl !important; text-align: right !important; padding-right: 0 !important; margin-right: 0 !important;">
              ${includesList.map((item: string) => `<li style="direction: rtl !important; text-align: right !important;" class="flex flex-row items-center justify-start gap-md w-full"><span class="material-symbols-outlined text-primary">${isFeatured ? 'check_circle' : 'check'}</span> <span class="font-body-md text-body-md text-on-surface-variant">${item}</span></li>`).join('')}
            </ul>
          </div>
          <button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="w-full mt-auto ${isFeatured ? 'bg-primary text-on-primary py-md rounded-sm font-label-sm text-label-sm hover:brightness-110 transition-all duration-300 shadow-md' : 'border border-primary/40 text-primary py-md rounded-sm font-label-sm text-label-sm hover:bg-primary hover:text-on-primary transition-all duration-300'}" style="direction: rtl !important; text-align: center !important;">
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
<html class="scroll-smooth" dir="rtl" lang="he" style="scroll-behavior: smooth;">
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
        
        .glass-hero-wrapper {
            position: relative;
        }
        .glass-hero {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 11px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
            animation: gentleFloat 6s ease-in-out infinite;
        }
        @keyframes gentleFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-3px) rotate(0.5deg); }
            50% { transform: translateY(0) rotate(0deg); }
            75% { transform: translateY(3px) rotate(-0.5deg); }
        }
        .gallery-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
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
<nav class="fixed top-0 w-full z-50 bg-transparent transition-all duration-500 px-lg py-md flex flex-row-reverse justify-between items-center left-0 right-0">
<div class="flex items-center gap-sm">
${logo_url ? `<img src="${logo_url}" alt="${studioName}" class="h-10 w-auto object-contain" />` : `<div class="font-display text-xl uppercase tracking-[0.2em] font-medium text-on-surface">${studioName}</div>`}
</div>
<button onclick="toggleMobileMenuElegant()" class="md:hidden p-2 text-on-surface hover:text-accent transition-colors">
<span class="material-symbols-outlined text-3xl" id="menu-icon-elegant">menu</span>
</button>
<div class="hidden md:flex flex-row-reverse gap-xl items-center">
<a onclick="window.scrollTo({top: 0, behavior: 'smooth'})" class="text-on-surface-variant hover:text-accent transition-colors text-sm uppercase tracking-widest cursor-pointer">בית</a>
<a onclick="document.querySelector('#gallery').scrollIntoView({behavior: 'smooth'})" class="text-on-surface-variant hover:text-accent transition-colors text-sm uppercase tracking-widest cursor-pointer">גלריות</a>
<a onclick="document.querySelector('#pricing').scrollIntoView({behavior: 'smooth'})" class="text-on-surface-variant hover:text-accent transition-colors text-sm uppercase tracking-widest cursor-pointer">חבילות צילום</a>
<a onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="text-on-surface-variant hover:text-accent transition-colors text-sm uppercase tracking-widest cursor-pointer">יצירת קשר</a>
</div>
</nav>
<div id="mobile-menu-elegant" class="hidden md:hidden fixed top-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#0F0F0D]/10">
<div class="flex flex-col gap-md px-lg py-md">
<a onclick="window.scrollTo({top: 0, behavior: 'smooth'}); toggleMobileMenuElegant()" class="text-on-surface hover:text-accent transition-colors text-lg uppercase tracking-widest py-2 cursor-pointer">בית</a>
<a onclick="document.querySelector('#gallery').scrollIntoView({behavior: 'smooth'}); toggleMobileMenuElegant()" class="text-on-surface hover:text-accent transition-colors text-lg uppercase tracking-widest py-2 cursor-pointer">גלריות</a>
<a onclick="document.querySelector('#pricing').scrollIntoView({behavior: 'smooth'}); toggleMobileMenuElegant()" class="text-on-surface hover:text-accent transition-colors text-lg uppercase tracking-widest py-2 cursor-pointer">חבילות צילום</a>
<a onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'}); toggleMobileMenuElegant()" class="text-on-surface hover:text-accent transition-colors text-lg uppercase tracking-widest py-2 cursor-pointer">יצירת קשר</a>
</div>
</div>
<script>
function toggleMobileMenuElegant() {
const menu = document.getElementById('mobile-menu-elegant');
const icon = document.getElementById('menu-icon-elegant');
menu.classList.toggle('hidden');
icon.textContent = menu.classList.contains('hidden') ? 'menu' : 'close';
}
</script>
<main>
<section class="relative h-screen overflow-hidden reveal-on-scroll">
<div class="absolute inset-0 z-0 image-reveal active">
<picture>
<source media="(max-width: 768px)" srcset="${heroMobileImage}"/>
<img alt="סטודיו יוקרתי" class="w-full h-full object-cover" src="${heroImage}"/>
</picture>
</div>
<div class="relative z-[100] glass-hero-wrapper absolute top-[55%] -translate-y-1/2 left-4 md:left-4 md:top-[55%] top-[75%]">
<div class="glass-hero p-xl md:p-24 max-w-md text-center backdrop-blur-md">
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
</div>
</section>
<section class="px-margin-mobile md:px-margin-desktop py-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-xl reveal-on-scroll">
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
${aboutTitle || aboutSubtitle || aboutDescription ? `
<section class="px-margin-mobile md:px-margin-desktop py-32 max-w-7xl mx-auto reveal-on-scroll relative" id="about">
<div class="absolute -left-10 top-0 bottom-0 w-80 bg-gradient-to-r from-[${primaryColor}]/30 to-transparent blur-3xl opacity-70"></div>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
<div class="order-2 lg:order-1">
<span class="elegant-accent font-label-sm text-xs uppercase tracking-[0.3em] block mb-4">About · קצת עליי</span>
${aboutTitle ? `<h2 class="font-serif-hebrew text-4xl md:text-5xl mb-8 font-medium">${aboutTitle}</h2>` : ''}
${aboutSubtitle ? `<p class="font-body text-lg mb-6 leading-relaxed opacity-80" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}
${aboutDescription ? `<p class="font-body text-base mb-10 opacity-60 leading-relaxed" style="white-space: pre-line">${aboutDescription}</p>` : ''}
<button class="border border-[#0F0F0D] px-10 py-3 text-xs uppercase tracking-widest hover:bg-[#0F0F0D] hover:text-white transition-all duration-300">
                    הכירי את הצוות
                </button>
</div>
<div class="order-1 lg:order-2 image-reveal aspect-[4/5] shadow-2xl">
<img alt="צילום פורטרט" class="w-full h-full object-cover" src="${aboutImage}"/>
</div>
</div>
</section>
` : ''}
<section class="px-margin-mobile md:px-margin-desktop py-24 bg-white" id="gallery">
<div class="max-w-7xl mx-auto">
<div class="flex flex-row-reverse justify-between items-end mb-16 reveal-on-scroll">
<h2 class="font-serif-hebrew text-4xl md:text-5xl font-medium">קולקציות נבחרות</h2>
<a class="text-xs uppercase tracking-widest elegant-accent border-b border-accent pb-1 hover:opacity-70 transition-opacity" href="#">לכל הגלריות</a>
</div>
<div class="grid grid-cols-1 md:grid-cols-12 gap-6">
${galleries.length > 0 ? galleries.slice(0, 6).map((g, i) => {
  const year = new Date(g.created_at).getFullYear()
  const galleryUrl = `/public-gallery/${g.id}`
  const isLarge = i === 0
  const isVertical = i === 1
  const isMedium = i === 3
  const colSpan = isLarge ? 'md:col-span-8' : isVertical ? 'md:col-span-4' : isMedium ? 'md:col-span-8' : 'md:col-span-4'
  const aspectRatio = isLarge ? 'aspect-[16/9]' : isVertical ? 'aspect-[3/4]' : isMedium ? 'aspect-[21/9]' : 'aspect-square'
  return `
<div class="${colSpan} group relative overflow-hidden reveal-on-scroll" style="transition-delay: ${i * 100}ms;">
<div class="image-reveal cursor-pointer ${aspectRatio} w-full bg-[#eae8e5] overflow-hidden">
<img alt="${g.title}" class="gallery-img w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src="${g.preview_url}"/>
<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-start justify-end p-lg">
<h3 class="font-display text-2xl mb-1 text-white">${g.title}</h3>
<p class="text-xs uppercase tracking-widest text-white/80 mb-4">${year}</p>
<button onclick="window.parent.postMessage({type: 'navigate', url: '${galleryUrl}'}, '*')" class="bg-white text-black px-6 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-gray-200 transition-colors">
צפה בגלריה
</button>
</div>
</div>
</div>`
}).join('') : ''}
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
${logo_url ? `<img src="${logo_url}" alt="${studioName}" class="h-10 w-auto object-contain" />` : `<div class="font-display text-xl uppercase tracking-widest text-on-surface">${studioName}</div>`}
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
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
</script>
</body>
</html>
  `;

  // MODERN THEME - EXACT COPY FROM SOURCE WITH DYNAMIC DATA
  const ModernTheme = () => `
<!DOCTYPE html>
<html class="light" dir="rtl" lang="he" style="scroll-behavior: smooth;">
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
<nav class="fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent bg-background/95 backdrop-blur-sm" id="navbar">
<div class="flex flex-row-reverse justify-between items-center px-lg py-md max-w-7xl mx-auto w-full">
<div class="flex items-center gap-sm">
${logo_url ? `<img src="${logo_url}" alt="${studioName}" class="h-10 w-auto object-contain" />` : `<span class="font-headline text-xl font-bold text-on-surface">${studioName}</span>`}
</div>
<button onclick="toggleMobileMenu()" class="md:hidden p-2 text-on-surface hover:text-primary transition-colors">
<span class="material-symbols-outlined text-3xl" id="menu-icon">menu</span>
</button>
<div class="hidden md:flex flex-row-reverse gap-xl items-center">
<a onclick="window.scrollTo({top: 0, behavior: 'smooth'})" class="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium cursor-pointer">בית</a>
<a onclick="document.querySelector('#portfolio').scrollIntoView({behavior: 'smooth'})" class="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium cursor-pointer">גלריות</a>
<a onclick="document.querySelector('#pricing').scrollIntoView({behavior: 'smooth'})" class="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium cursor-pointer">חבילות צילום</a>
<a onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium cursor-pointer">יצירת קשר</a>
</div>
</div>
<div id="mobile-menu" class="hidden md:hidden bg-background border-b border-outline-variant">
<div class="flex flex-col gap-md px-lg py-md">
<a onclick="window.scrollTo({top: 0, behavior: 'smooth'}); toggleMobileMenu()" class="text-on-surface hover:text-primary transition-colors text-lg font-medium py-2 cursor-pointer">בית</a>
<a onclick="document.querySelector('#portfolio').scrollIntoView({behavior: 'smooth'}); toggleMobileMenu()" class="text-on-surface hover:text-primary transition-colors text-lg font-medium py-2 cursor-pointer">גלריות</a>
<a onclick="document.querySelector('#pricing').scrollIntoView({behavior: 'smooth'}); toggleMobileMenu()" class="text-on-surface hover:text-primary transition-colors text-lg font-medium py-2 cursor-pointer">חבילות צילום</a>
<a onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'}); toggleMobileMenu()" class="text-on-surface hover:text-primary transition-colors text-lg font-medium py-2 cursor-pointer">יצירת קשר</a>
</div>
</div>
</nav>
<script>
function toggleMobileMenu() {
const menu = document.getElementById('mobile-menu');
const icon = document.getElementById('menu-icon');
menu.classList.toggle('hidden');
icon.textContent = menu.classList.contains('hidden') ? 'menu' : 'close';
}
</script>
<main class="pt-xxl">
${aboutTitle || aboutSubtitle || aboutDescription ? `
<section class="max-w-7xl mx-auto px-lg py-xxl grid grid-cols-1 md:grid-cols-2 gap-xl items-center relative" id="about">
<div class="absolute -left-10 top-0 bottom-0 w-80 bg-gradient-to-r from-[${primaryColor}]/30 to-transparent blur-3xl opacity-70"></div>
<div class="flex flex-col gap-md order-2 md:order-1 animate-reveal relative z-10">
<span class="text-primary font-label-sm text-xs uppercase tracking-[0.3em] block mb-4">About · קצת עליי</span>
${aboutTitle ? '<h1 class="font-headline text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">' + aboutTitle + '</h1>' : '<h1 class="font-headline text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">אמנות הרגע <br/><span class="text-primary">בצורה מודרנית</span></h1>'}
${aboutSubtitle ? '<p class="text-lg md:text-xl text-on-surface-variant max-w-xl leading-relaxed" style="white-space: pre-line">' + aboutSubtitle + '</p>' : ''}
${aboutDescription ? '<p class="text-lg md:text-xl text-on-surface-variant max-w-xl leading-relaxed" style="white-space: pre-line">' + aboutDescription + '</p>' : ''}
<div class="flex flex-wrap gap-md pt-md">
<button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="bg-primary text-white px-xl py-md rounded-lg text-lg font-bold btn-magnetic hover:shadow-xl shadow-indigo-200 transition-all">
                    התחילו עכשיו
                </button>
<button class="border border-outline text-on-surface px-xl py-md rounded-lg text-lg font-bold btn-magnetic hover:bg-surface-variant transition-all">
                    לצפייה בגלריה
                </button>
</div>
</div>
<div class="relative order-1 md:order-2 animate-reveal delay-100">
<div class="aspect-square rounded-2xl overflow-hidden modern-shadow hover-scale group">
<picture>
<source media="(max-width: 768px)" srcset="${heroMobileImage}"/>
<img alt="סטודיו לצילום מקצועי" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="${heroImage}"/>
</picture>
</div>
<div class="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-2xl -z-10"></div>
</div>
</section>
` : ''}
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
${galleries.length > 1 ? galleries.slice(1, 4).map((g, i) => {
  const year = new Date(g.created_at).getFullYear()
  const galleryUrl = '/public-gallery/' + g.id
  const aspectClass = i === 2 ? 'col-span-1 sm:col-span-2 aspect-video' : 'aspect-square'
  const animationDelay = i * 100
  return '<div class="' + aspectClass + ' rounded-xl overflow-hidden group relative animate-reveal" style="animation-delay: ' + animationDelay + 'ms;"><img alt="' + g.title + '" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="' + g.preview_url + '"/><div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-lg"><div class="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 w-full"><p class="text-white font-headline text-xl">' + g.title + '</p><p class="text-white/80 text-sm mt-1">' + year + '</p><button onclick="window.parent.postMessage({type: \'navigate\', url: \'' + galleryUrl + '\'}, \'*\')" class="mt-3 bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors">צפה בגלריה</button></div></div></div>'
}).join('') : ''}
</div>
<div class="h-full animate-reveal delay-300">
${galleries.length > 0 ? '<div class="rounded-xl overflow-hidden h-[400px] md:h-[600px] group relative"><img alt="צילום חתונה" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="' + galleries[0]?.preview_url + '"/><div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-lg"><div class="translate-y-4 group-hover:translate-y-0 transition-transform duration-300"><p class="text-white font-headline text-2xl">' + galleries[0].title + '</p><p class="text-white/80 text-sm mt-1">' + new Date(galleries[0].created_at).getFullYear() + '</p></div></div></div>' : ''}
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
<input class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-right" id="contact_name" placeholder="שם מלא" type="text"/>
</div>
<div class="relative">
<input class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-right" id="contact_email" placeholder="אימייל" type="email"/>
</div>
</div>
<div class="relative">
<input class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-right" id="contact_phone" placeholder="טלפון" type="tel"/>
</div>
<div class="relative">
<textarea class="w-full bg-white border border-outline-variant rounded-lg px-lg py-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 text-right" id="contact_message" placeholder="הודעה" rows="3"></textarea>
</div>
<button class="bg-white text-primary px-xl py-md rounded-lg font-bold btn-magnetic hover:shadow-xl w-full transition-all" type="submit">
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
${logo_url ? `<img src="${logo_url}" alt="${studioName}" class="h-10 w-auto object-contain" />` : `<span class="font-headline text-2xl font-bold text-primary">${studioName}</span>`}
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
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
        }
        @keyframes float-vertical {
            0%, 100% { margin-top: 0px; }
            50% { margin-top: -4px; }
        }
        .glass-card-float {
            animation: float 5s ease-in-out infinite;
        }
        .vertical-text-float {
            animation: float-vertical 6s ease-in-out infinite;
        }
        .glass-card-frame {
            position: relative;
            display: inline-block;
        }
        .glass-card-accent-line {
            position: absolute;
            bottom: -18px;
            right: 40px;
            width: 56px;
            height: 2px;
            background: ${primaryColor};
            pointer-events: none;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.75);
            border-radius: 0;
            box-shadow: none;
        }
        .about-section-label {
            font-family: 'Heebo', sans-serif;
            font-size: 11px;
            letter-spacing: 0.32em;
            text-transform: uppercase;
            color: rgba(45, 40, 37, 0.5);
        }
        .about-title {
            font-family: 'Frank Ruhl Libre', serif;
            font-size: clamp(2rem, 3.8vw, 3.1rem);
            line-height: 1.28;
            font-weight: 700;
            color: #2d2825;
        }
        .about-title-underline {
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 6px;
        }
        .about-body-primary {
            font-family: 'Heebo', sans-serif;
            font-size: 18px;
            line-height: 1.9;
            color: rgba(45, 40, 37, 0.82);
        }
        .about-body-secondary {
            font-family: 'Heebo', sans-serif;
            font-size: 16px;
            line-height: 1.85;
            color: rgba(45, 40, 37, 0.65);
        }
        .about-stat-number {
            font-family: 'Frank Ruhl Libre', serif;
            font-size: clamp(2rem, 3vw, 2.75rem);
            line-height: 1;
            font-weight: 400;
            color: #2d2825;
        }
        .about-stat-label {
            font-family: 'Heebo', sans-serif;
            font-size: 11px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: rgba(45, 40, 37, 0.42);
            margin-top: 10px;
        }
        .about-image-quote {
            background: rgba(255, 255, 255, 0.96);
            padding: 22px 26px;
            box-shadow: 0 16px 40px rgba(45, 40, 37, 0.08);
        }
        .about-image-quote-text {
            font-family: 'Frank Ruhl Libre', serif;
            font-size: 1.05rem;
            line-height: 1.65;
            font-style: italic;
            color: #2d2825;
            text-align: right;
        }
        .about-image-quote-line {
            width: 36px;
            height: 1px;
            background: ${primaryColor};
            margin: 14px 0 10px auto;
        }
        .about-image-quote-name {
            font-family: 'Heebo', sans-serif;
            font-size: 12px;
            letter-spacing: 0.12em;
            color: rgba(45, 40, 37, 0.5);
            text-align: left;
        }
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
<nav class="fixed top-0 w-full z-50 transition-all duration-700 border-none bg-transparent" id="main-nav">
<div class="flex flex-row-reverse justify-between items-center px-lg py-md max-w-7xl mx-auto w-full">
<div class="flex items-center gap-sm">
${logo_url ? `<img src="${logo_url}" alt="${studioName}" class="h-10 w-auto object-contain" />` : `<span class="font-headline-sm text-headline-sm text-on-surface tracking-tight">${studioName}</span>`}
</div>
<button onclick="toggleMobileMenuClassic()" class="md:hidden p-2 text-on-surface hover:text-primary transition-colors">
<span class="material-symbols-outlined text-3xl" id="menu-icon-classic">menu</span>
</button>
<div class="hidden md:flex flex-row-reverse gap-xl items-center">
<a onclick="window.scrollTo({top: 0, behavior: 'smooth'})" class="font-label-sm text-label-sm text-primary hover:text-primary transition-colors cursor-pointer">בית</a>
<a onclick="document.querySelector('#galleries').scrollIntoView({behavior: 'smooth'})" class="font-label-sm text-label-sm text-primary hover:text-primary transition-colors cursor-pointer">גלריות</a>
<a onclick="document.querySelector('#pricing').scrollIntoView({behavior: 'smooth'})" class="font-label-sm text-label-sm text-primary hover:text-primary transition-colors cursor-pointer">חבילות צילום</a>
<a onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="font-label-sm text-label-sm text-primary hover:text-primary transition-colors cursor-pointer">יצירת קשר</a>
</div>
</div>
<div id="mobile-menu-classic" class="hidden md:hidden fixed top-16 left-0 right-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/10">
<div class="flex flex-col gap-md px-lg py-md">
<a onclick="window.scrollTo({top: 0, behavior: 'smooth'}); toggleMobileMenuClassic()" class="text-on-surface hover:text-primary transition-colors text-lg font-label-sm py-2 cursor-pointer">בית</a>
<a onclick="document.querySelector('#galleries').scrollIntoView({behavior: 'smooth'}); toggleMobileMenuClassic()" class="text-on-surface hover:text-primary transition-colors text-lg font-label-sm py-2 cursor-pointer">גלריות</a>
<a onclick="document.querySelector('#pricing').scrollIntoView({behavior: 'smooth'}); toggleMobileMenuClassic()" class="text-on-surface hover:text-primary transition-colors text-lg font-label-sm py-2 cursor-pointer">חבילות צילום</a>
<a onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'}); toggleMobileMenuClassic()" class="text-on-surface hover:text-primary transition-colors text-lg font-label-sm py-2 cursor-pointer">יצירת קשר</a>
</div>
</div>
</nav>
<script>
function toggleMobileMenuClassic() {
const menu = document.getElementById('mobile-menu-classic');
const icon = document.getElementById('menu-icon-classic');
menu.classList.toggle('hidden');
icon.textContent = menu.classList.contains('hidden') ? 'menu' : 'close';
}
</script>
<section class="relative h-screen w-full flex items-end justify-start overflow-hidden reveal" id="hero">
<div class="absolute inset-0 z-0 scale-105">
<picture>
<source media="(max-width: 768px)" srcset="${heroMobileImage}"/>
<img alt="סטודיו צילום קלאסי" class="w-full h-full object-cover" src="${heroImage}"/>
</picture>
</div>
<div class="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none z-20 hidden lg:block vertical-text-float">
<div class="text-base font-medium tracking-widest text-white/50 whitespace-nowrap" style="writing-mode: vertical-rl; transform: rotate(180deg);">
${studioName} · ${photographerName}
</div>
</div>
<div class="relative z-10 hidden lg:block pl-32 pb-16">
<div class="glass-card-frame">
<div class="glass-card glass-card-float pt-24 pb-28 px-12 w-[450px] m-5">
<span class="block font-label-sm text-label-sm text-white/80 tracking-[0.3em] mb-6 uppercase">${studioName}</span>
<h1 class="font-display-lg text-4xl md:text-5xl mb-6 leading-tight text-white">${photographerName || 'אפרת כהן'} | צילום</h1>
<p class="font-body-lg text-body-lg text-white/90 mb-8 leading-relaxed">תופסים את הקסם שקורה בין הרגעים, בסטייל קלאסי ומרגש.</p>
<div class="flex gap-4">
<button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="flex-1 bg-primary text-on-primary px-xl py-md rounded-none font-label-sm text-label-sm hover:brightness-110 hover:-translate-y-1 transition-all shadow-lg active:scale-95">
                        תיאום פגישה
                    </button>
<button onclick="document.querySelector('#galleries').scrollIntoView({behavior: 'smooth'})" class="flex-1 border border-white/30 text-white px-xl py-md rounded-none font-label-sm text-label-sm hover:bg-white/10 transition-all">
                        לצפייה בגלריות
                    </button>
</div>
</div>
<span class="glass-card-accent-line" aria-hidden="true"></span>
</div>
</div>
<div class="lg:hidden relative z-10 text-center px-md max-w-4xl text-white">
<span class="block font-label-sm text-label-sm text-white/80 tracking-widest mb-md uppercase">${studioName}</span>
<h1 class="font-display-lg text-display-lg-mobile md:text-display-lg mb-md leading-tight">${photographerName || 'אפרת כהן'} | צילום</h1>
<p class="font-body-lg text-body-lg text-white/90 mb-xl max-w-2xl mx-auto">תופסים את הקסם שקורה בין הרגעים, בסטייל קלאסי ומרגש.</p>
<button onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="inline-block bg-primary text-on-primary px-xxl py-md rounded-sm font-label-sm text-label-sm hover:brightness-110 hover:-translate-y-1 transition-all shadow-lg active:scale-95">
                תיאום פגישה
            </button>
</div>
</section>
${aboutTitle || aboutSubtitle || aboutDescription ? `
<section class="py-xxl max-w-7xl mx-auto px-lg reveal relative" id="about">
<div class="grid grid-cols-1 md:grid-cols-2 gap-xl md:gap-xxl items-center">
<div class="order-1 space-y-8 md:pr-8">
<span class="about-section-label block">About — קצת עליי</span>
${aboutTitle ? `<h2 class="about-title">${underlineLastWord(aboutTitle)}</h2>` : `<h2 class="about-title">${underlineLastWord('אודות הסטודיו')}</h2>`}
<div class="space-y-6">
${aboutSubtitle ? `<p class="about-body-primary" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}
${aboutDescription ? `<p class="about-body-secondary" style="white-space: pre-line">${aboutDescription}</p>` : ''}
</div>
<div class="grid grid-cols-3 gap-md md:gap-lg border-t border-outline-variant/15 pt-10 mt-4">
<div class="text-right">
<div class="about-stat-number">${statsClients}+</div>
<div class="about-stat-label">לקוחות מרוצים</div>
</div>
<div class="text-right">
<div class="about-stat-number">${statsProjects}+</div>
<div class="about-stat-label">תיקי עבודות</div>
</div>
<div class="text-right">
<div class="about-stat-number">${statsYears}+</div>
<div class="about-stat-label">שנות ניסיון</div>
</div>
</div>
</div>
<div class="order-2 relative">
<img alt="דיוקן צלמת" class="w-full aspect-[4/5] md:aspect-[3/4] object-cover" src="${aboutImage}"/>
<div class="about-image-quote absolute -bottom-8 -left-6 md:-bottom-10 md:-left-10 max-w-[260px] hidden md:block">
<div class="about-image-quote-line"></div>
<p class="about-image-quote-name">— ${photographerName}</p>
</div>
</div>
</div>
</section>
` : ''}
<section class="bg-surface-container-low py-xxl reveal" id="galleries">
<div class="max-w-7xl mx-auto px-lg">
<div class="text-center mb-xl">
<h2 class="font-headline-md text-headline-md text-on-surface">עבודות נבחרות</h2>
<p class="font-body-md text-body-md text-on-surface-variant mt-sm">מבט אל הרגעים שהפכו לנצח</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
${galleries.length > 0 ? galleries.slice(0, 3).map((g, i) => {
  const year = new Date(g.created_at).getFullYear()
  const galleryUrl = `/public-gallery/${g.id}`
  return `
<div class="group relative overflow-hidden rounded-sm cursor-pointer stagger-item shadow-sm transition-all duration-700">
<img alt="${g.title}" class="w-full aspect-[3/4] object-cover transition-transform duration-1000 group-hover:scale-105" src="${g.preview_url}"/>
<div class="absolute inset-0 classic-overlay opacity-0 group-hover:opacity-100 transition-all duration-700 flex items-end p-lg">
<div class="translate-y-4 group-hover:translate-y-0 transition-transform duration-700 w-full">
<span class="text-white font-headline-sm text-headline-sm">${g.title}</span>
<span class="text-white/80 text-xs block mt-1">${year}</span>
<button onclick="window.parent.postMessage({type: 'navigate', url: '${galleryUrl}'}, '*')" class="mt-3 bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors">
צפה בגלריה
</button>
</div>
</div>
</div>`
}).join('') : ''}
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
                ${logo_url ? `<img src="${logo_url}" alt="${studioName}" class="h-10 w-auto object-contain" />` : `${studioName}`}
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
                nav.classList.remove('py-md', 'border-none', 'bg-transparent');
            } else {
                nav.classList.remove('bg-surface/90', 'backdrop-blur-md', 'py-sm', 'border-outline-variant/20', 'shadow-sm');
                nav.classList.add('py-md', 'border-none', 'bg-transparent');
            }
        });
        
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
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
<meta content="width=device-width, in" style="scroll-behavior: smooth;itial-scale=1.0" name="viewport"/>
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
<div class="flex items-center gap-sm">
${logo_url ? `<img src="${logo_url}" alt="${studioName}" class="h-10 w-auto object-contain" />` : `<span class="font-headline-sm text-headline-sm text-on-surface tracking-tighter">STUDIO <span class="text-primary font-light">GALLERY</span></span>`}
</div>
<button onclick="toggleMobileMenuDark()" class="md:hidden p-2 text-on-surface hover:text-primary transition-colors">
<span class="material-symbols-outlined text-3xl" id="menu-icon-dark">menu</span>
</button>
<div class="hidden md:flex flex-row-reverse gap-xl items-center">
<a onclick="window.scrollTo({top: 0, behavior: 'smooth'})" class="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm btn-fuchsia-transition cursor-pointer">בית</a>
<a onclick="document.querySelector('#gallery').scrollIntoView({behavior: 'smooth'})" class="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm btn-fuchsia-transition cursor-pointer">גלריות</a>
<a onclick="document.querySelector('#pricing').scrollIntoView({behavior: 'smooth'})" class="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm btn-fuchsia-transition cursor-pointer">חבילות צילום</a>
<a onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'})" class="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm btn-fuchsia-transition cursor-pointer">יצירת קשר</a>
</div>
</div>
<div id="mobile-menu-dark" class="hidden md:hidden fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-white/10">
<div class="flex flex-col gap-md px-lg py-md">
<a onclick="window.scrollTo({top: 0, behavior: 'smooth'}); toggleMobileMenuDark()" class="text-on-surface hover:text-primary transition-colors text-lg font-label-sm btn-fuchsia-transition py-2 cursor-pointer">בית</a>
<a onclick="document.querySelector('#gallery').scrollIntoView({behavior: 'smooth'}); toggleMobileMenuDark()" class="text-on-surface hover:text-primary transition-colors text-lg font-label-sm btn-fuchsia-transition py-2 cursor-pointer">גלריות</a>
<a onclick="document.querySelector('#pricing').scrollIntoView({behavior: 'smooth'}); toggleMobileMenuDark()" class="text-on-surface hover:text-primary transition-colors text-lg font-label-sm btn-fuchsia-transition py-2 cursor-pointer">חבילות צילום</a>
<a onclick="document.querySelector('#contact').scrollIntoView({behavior: 'smooth'}); toggleMobileMenuDark()" class="text-on-surface hover:text-primary transition-colors text-lg font-label-sm btn-fuchsia-transition py-2 cursor-pointer">יצירת קשר</a>
</div>
</div>
</nav>
<script>
function toggleMobileMenuDark() {
const menu = document.getElementById('mobile-menu-dark');
const icon = document.getElementById('menu-icon-dark');
menu.classList.toggle('hidden');
icon.textContent = menu.classList.contains('hidden') ? 'menu' : 'close';
}
</script>
<section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
<div class="absolute inset-0 z-0">
<picture>
<source media="(max-width: 768px)" srcset="${heroMobileImage}"/>
<img class="w-full h-full object-cover grayscale opacity-40 scale-110 transition-transform duration-[3s] ease-out" data-alt="High-end architectural photograph of a minimalist space" id="hero-img" src="${heroImage}"/>
</picture>
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
${aboutTitle || aboutSubtitle || aboutDescription ? `
<section class="py-xl md:py-xxl container mx-auto px-lg reveal-on-scroll relative" id="about">
<div class="absolute -left-10 top-0 bottom-0 w-80 bg-gradient-to-r from-[${primaryColor}]/30 to-transparent blur-3xl opacity-70"></div>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-xl items-center relative z-10">
<div class="relative group">
<div class="absolute -top-4 -right-4 w-full h-full border border-primary/30 z-0"></div>
<img class="relative z-10 w-full aspect-[4/5] object-cover grayscale brightness-90 hover:grayscale-0 transition-all duration-700" src="${aboutImage}"/>
</div>
<div class="lg:pr-xl">
<span class="text-primary font-label-sm text-xs uppercase tracking-[0.3em] block mb-4">About · קצת עליי</span>
${aboutTitle ? `<h2 class="font-headline-md text-headline-md mb-lg">${aboutTitle}</h2>` : '<h2 class="font-headline-md text-headline-md mb-lg">החזון שלנו הוא לתעד רגעים שחיים לנצח</h2>'}
${aboutSubtitle ? `<p class="font-body-md text-on-surface-variant mb-lg" style="white-space: pre-line">${aboutSubtitle}</p>` : ''}
${aboutDescription ? `<p class="font-body-md text-on-surface-variant mb-xl" style="white-space: pre-line">${aboutDescription}</p>` : ''}
<div class="grid grid-cols-3 gap-lg border-t border-white/10 pt-xl">
<div>
<div class="text-primary font-headline-sm mb-xs">${statsProjects}+</div>
<div class="font-label-sm uppercase tracking-widest text-on-surface/60">פרויקטים</div>
</div>
<div>
<div class="text-primary font-headline-sm mb-xs">${statsClients}+</div>
<div class="font-label-sm uppercase tracking-widest text-on-surface/60">לקוחות</div>
</div>
<div>
<div class="text-primary font-headline-sm mb-xs">${statsYears}</div>
<div class="font-label-sm uppercase tracking-widest text-on-surface/60">שנות ניסיון</div>
</div>
</div>
</div>
</div>
</section>
` : ''}
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
${galleries.length > 0 ? `
<div class="sm:col-span-2 sm:row-span-2 relative group overflow-hidden bg-surface min-h-[400px] sm:min-h-[500px] lg:min-h-full">
<img class="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0" data-alt="High-contrast cinematic portrait" src="${galleries[0]?.preview_url}"/>
<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-xl">
<div class="translate-y-4 group-hover:translate-y-0 transition-transform w-full">
<h3 class="font-headline-sm text-on-primary mb-xs">${galleries[0].title}</h3>
<p class="font-body-md text-on-primary/80">${new Date(galleries[0].created_at).getFullYear()}</p>
<button onclick="window.parent.postMessage({type: 'navigate', url: '/public-gallery/${galleries[0].id}'}, '*')" class="mt-3 bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors">
צפה בגלריה
</button>
</div>
</div>
</div>
${galleries.length > 1 ? `
<div class="sm:col-span-2 lg:col-span-2 relative group overflow-hidden bg-surface min-h-[300px]">
<img class="w-full h-full object-cover grayscale brightness-75 transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0" data-alt="Minimalist architectural photograph" src="${galleries[1]?.preview_url}"/>
<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-xl">
<div class="translate-y-4 group-hover:translate-y-0 transition-transform w-full">
<h3 class="font-headline-sm text-on-primary mb-xs">${galleries[1].title}</h3>
<p class="font-body-md text-on-primary/80">${new Date(galleries[1].created_at).getFullYear()}</p>
<button onclick="window.parent.postMessage({type: 'navigate', url: '/public-gallery/${galleries[1].id}'}, '*')" class="mt-3 bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors">
צפה בגלריה
</button>
</div>
</div>
</div>
` : ''}
${galleries.length > 2 ? `
<div class="relative group overflow-hidden bg-surface min-h-[300px]">
<img class="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0" data-alt="Camera lens detail" src="${galleries[2]?.preview_url}"/>
<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-xl">
<div class="translate-y-4 group-hover:translate-y-0 transition-transform w-full">
<h3 class="font-headline-sm text-on-primary mb-xs">${galleries[2].title}</h3>
<p class="font-body-md text-on-primary/80">${new Date(galleries[2].created_at).getFullYear()}</p>
<button onclick="window.parent.postMessage({type: 'navigate', url: '/public-gallery/${galleries[2].id}'}, '*')" class="mt-3 bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors">
צפה בגלריה
</button>
</div>
</div>
</div>
` : ''}
${galleries.length > 3 ? `
<div class="relative group overflow-hidden bg-surface min-h-[300px]">
<img class="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0" data-alt="Minimalist landscape" src="${galleries[3]?.preview_url}"/>
<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-xl">
<div class="translate-y-4 group-hover:translate-y-0 transition-transform w-full">
<h3 class="font-headline-sm text-on-primary mb-xs">${galleries[3].title}</h3>
<p class="font-body-md text-on-primary/80">${new Date(galleries[3].created_at).getFullYear()}</p>
<button onclick="window.parent.postMessage({type: 'navigate', url: '/public-gallery/${galleries[3].id}'}, '*')" class="mt-3 bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors">
צפה בגלריה
</button>
</div>
</div>
</div>
` : ''}
` : ''}
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
<section class="py-xl md:py-xxl container mx-auto px-lg reveal-on-scroll" id="contact">
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
                ${logo_url ? `<img src="${logo_url}" alt="${studioName}" class="h-10 w-auto object-contain" />` : `STUDIO <span class="text-primary font-light">GALLERY</span>`}
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
        
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
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
