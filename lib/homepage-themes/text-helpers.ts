import { getBrandingPublicMediaPath } from '@/lib/branding-public-url'
import { getBrandingFaviconStoragePath } from '@/lib/branding/logo-favicon-path'
import type { HomepageCopy } from '@/lib/homepage-copy'

export function hexToRgb(hex: string): string {

  const normalized = hex.replace('#', '').trim()

  const value =

    normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized

  const int = Number.parseInt(value, 16)

  if (Number.isNaN(int)) return '184, 149, 63'

  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`

}



export function underlineLastWord(text: string) {

  const trimmed = text.trim()

  if (!trimmed) return trimmed

  const words = trimmed.split(/\s+/)

  if (words.length === 1) {

    return `<span class="about-title-underline">${trimmed}</span>`

  }

  const lastWord = words.pop()!

  return `${words.join(' ')} <span class="about-title-underline">${lastWord}</span>`

}



export function brandLastWord(text: string) {

  const trimmed = text.trim()

  if (!trimmed) return trimmed

  const words = trimmed.split(/\s+/)

  if (words.length === 1) {

    return `<span class="text-primary font-light">${trimmed}</span>`

  }

  const lastWord = words.pop()!

  return `${words.join(' ')} <span class="text-primary font-light">${lastWord}</span>`

}



export function glassHeroTitle(text: string) {

  const trimmed = text.trim()

  if (!trimmed) return trimmed

  const words = trimmed.split(/\s+/)

  const lastIndex = words.length - 1

  const formatWords = (chunk: string[], offset: number) =>

    chunk

      .map((word, index) => {

        const safeWord = escapeHtml(word)

        if (offset + index === lastIndex) {

          return `<span class="text-primary">${safeWord}</span>`

        }

        return safeWord

      })

      .join(' ')

  const toLine = (chunk: string[], offset: number) =>

    `<span class="glass-hero-title__line">${formatWords(chunk, offset)}</span>`

  if (words.length <= 2) {

    return toLine(words, 0)

  }

  return toLine(words.slice(0, 2), 0) + toLine(words.slice(2), 2)

}



export function escapeHtml(text: string): string {

  return String(text)

    .replace(/&/g, '&amp;')

    .replace(/</g, '&lt;')

    .replace(/>/g, '&gt;')

    .replace(/"/g, '&quot;')

    .replace(/'/g, '&#39;')

}



export function generatePhotographerDocumentHead(
  studioName: string,
  logoUrl: string | null,
  faviconOrigin?: string,
  userId?: string
): string {

  const title = escapeHtml(studioName)

  const faviconStoragePath =
    userId && logoUrl ? getBrandingFaviconStoragePath(userId, logoUrl) : null
  const publicFaviconPath = faviconStoragePath
    ? getBrandingPublicMediaPath(faviconStoragePath)
    : logoUrl
      ? getBrandingPublicMediaPath(logoUrl)
      : null
  const faviconHref =
    publicFaviconPath && faviconOrigin
      ? `${faviconOrigin.replace(/\/$/, '')}${publicFaviconPath}`
      : logoUrl

  const faviconLink = faviconHref

    ? `<link rel="icon" href="${escapeHtml(faviconHref)}" sizes="any"/>`

    : ''

  return `<title>${title}</title>\n${faviconLink}`

}



export function generateContactPrivacyConsentHTML(

  theme: 'elegant' | 'modern' | 'classic' | 'dark',

  primaryColor: string,

  copy: HomepageCopy,

  wrapperClass = ''

): string {

  const labelTextClass = {

    elegant: 'text-sm font-light opacity-80 leading-relaxed',

    modern: 'text-sm text-white/90 leading-relaxed',

    classic: 'classic-contact-privacy-text text-sm text-on-surface-variant leading-relaxed block w-auto max-w-full m-0',

    dark: 'text-sm text-on-surface-variant leading-relaxed',

  }[theme]



  const privacyTextWrapperClass = theme === 'classic' ? 'flex-1 w-auto max-w-full' : 'flex-1 min-w-0'



  const privacyWrapperClass = [

    wrapperClass,

    theme === 'classic' ? 'classic-contact-privacy-consent' : '',

  ]

    .filter(Boolean)

    .join(' ')



  const linkClass = {

    elegant: 'underline hover:opacity-80',

    modern: 'underline text-white hover:opacity-80',

    classic: 'text-primary underline hover:opacity-80',

    dark: 'text-primary underline hover:opacity-80',

  }[theme]



  return `

<div class="contact-privacy-consent w-full min-w-0 flex flex-row items-start gap-sm text-start rtl:text-right ${privacyWrapperClass}">

<input type="checkbox" name="privacy_consent" id="contact_privacy_consent_${theme}" required class="contact-privacy-checkbox mt-1 shrink-0 size-4 cursor-pointer rounded border border-current/30" style="accent-color: ${primaryColor};"/>

<p class="${labelTextClass} ${privacyTextWrapperClass}">

<label for="contact_privacy_consent_${theme}" class="cursor-pointer">${copy.contactForm.privacyBefore}</label><a href="/privacy" class="${linkClass}">${copy.contactForm.privacyLink}</a>.

</p>

</div>`.trim()

}



export function contactFormSubmitScript(photographerId: string, copy: HomepageCopy): string {

  return `

    (function() {

      var form = document.querySelector('#contact form');

      if (!form) return;

      form.addEventListener('submit', function(e) {

        e.preventDefault();

        if (!form.checkValidity()) {

          form.reportValidity();

          return;

        }

        var submitBtn = form.querySelector('button[type="submit"]');

        var originalLabel = submitBtn ? submitBtn.innerHTML : '';

        if (submitBtn) {

          submitBtn.disabled = true;

          submitBtn.textContent = '${copy.contactForm.submitting}';

        }

        var fd = new FormData(form);

        var payload = {

          photographerId: '${photographerId}',

          name: String(fd.get('name') || ''),

          email: String(fd.get('email') || ''),

          phone: String(fd.get('phone') || '') || undefined,

          subject: String(fd.get('subject') || '') || undefined,

          message: String(fd.get('message') || ''),

        };

        fetch('/api/contact-inquiry', {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify(payload),

        })

        .then(function(res) {

          return res.json().then(function(data) {

            return { ok: res.ok, data: data };

          });

        })

        .then(function(result) {

          if (!result.ok) throw new Error(result.data.error || '${copy.contactForm.submitError}');

          var section = document.querySelector('#contact .contact-section-content') || document.querySelector('#contact');

          if (section) {

            section.innerHTML = '<div class="text-center py-16"><p class="text-xl font-medium mb-2">${copy.contactForm.successTitle}</p><p class="opacity-70">${copy.contactForm.successBody}</p></div>';

          }

        })

        .catch(function(err) {

          alert(err.message || '${copy.contactForm.submitError}');

          if (submitBtn) {

            submitBtn.disabled = false;

            submitBtn.innerHTML = originalLabel;

          }

        });

      });

    })();

  `

}
