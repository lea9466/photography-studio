/** LTR layout overrides — only apply when html[dir="ltr"]. Hebrew RTL CSS stays untouched. */

export const HOMEPAGE_LTR_CSS = `

html[dir="ltr"] .homepage-gallery-header,

html[dir="ltr"] .homepage-gallery-header > div,

html[dir="ltr"] .homepage-gallery-header .elegant-section-heading {

  text-align: left !important;

  align-items: flex-start !important;

  justify-items: start !important;

  justify-content: flex-start !important;

}



html[dir="ltr"] .homepage-gallery-card-content {

  text-align: left;

}



html[dir="ltr"] .homepage-gallery-card:hover .homepage-gallery-card-arrow,

html[dir="ltr"] .homepage-gallery-card:focus-visible .homepage-gallery-card-arrow {

  transform: translateX(4px);

}



html[dir="ltr"] .recent-photos-header,

html[dir="ltr"] .recent-photos-header > div:not(.hp-posts-header--classic),

html[dir="ltr"] .recent-photos-header .elegant-section-heading {

  text-align: left !important;

  align-items: flex-start !important;

  justify-items: start !important;

  justify-content: flex-start !important;

}



html[dir="ltr"] .recent-photos-header > div:not(.hp-posts-header--classic):has(.portfolio-cta-wrap) {

  flex-direction: row !important;

  justify-content: space-between !important;

  align-items: center !important;

}



html[dir="ltr"] .faq-section__header,

html[dir="ltr"] .testimonials-section__header,

html[dir="ltr"] .homepage-packages-section__header {

  text-align: left !important;

}



html[dir="ltr"] .faq-section__header span,

html[dir="ltr"] .faq-section__header h2,

html[dir="ltr"] .faq-section__header p,

html[dir="ltr"] .testimonials-section__header span,

html[dir="ltr"] .testimonials-section__header h2,

html[dir="ltr"] .homepage-packages-section__header span,

html[dir="ltr"] .homepage-packages-section__header h2,

html[dir="ltr"] .faq-section__subtitle {

  text-align: left !important;

}



html[dir="ltr"] .faq-section__header .elegant-section-heading,

html[dir="ltr"] .testimonials-section__header .elegant-section-heading,

html[dir="ltr"] .faq-section__header .elegant-section-heading__watermark,

html[dir="ltr"] .faq-section__header .elegant-section-heading__title,

html[dir="ltr"] .testimonials-section__header .elegant-section-heading__watermark,

html[dir="ltr"] .testimonials-section__header .elegant-section-heading__title {

  text-align: left !important;

  justify-items: start !important;

  justify-self: start !important;

}



html[dir="ltr"] .public-gallery-section-header.text-right,

html[dir="ltr"] header.text-right {

  text-align: left !important;

}



html[dir="ltr"] .theme-classic .homepage-packages-row,

html[dir="ltr"] .theme-bold .homepage-packages-row {

  direction: ltr;

  text-align: left;

}



html[dir="ltr"] .theme-classic .homepage-packages-row__title,

html[dir="ltr"] .theme-bold .homepage-packages-row__title {

  justify-self: start;

  text-align: left;

}



html[dir="ltr"] .theme-classic .homepage-packages-row__title h3,

html[dir="ltr"] .theme-bold .homepage-packages-row__title h3,

html[dir="ltr"] .theme-classic .homepage-packages-row__title p,

html[dir="ltr"] .theme-bold .homepage-packages-row__title p {

  text-align: left;

  direction: ltr;

}



html[dir="ltr"] .theme-classic .homepage-packages-row__badge,

html[dir="ltr"] .theme-bold .homepage-packages-row__badge {

  right: auto;

  left: 0;

}



html[dir="ltr"] .theme-classic .homepage-packages-row__features,

html[dir="ltr"] .theme-bold .homepage-packages-row__features {

  text-align: left;

  direction: ltr;

  margin-inline-start: 0;

  margin-inline-end: 5rem;

}



html[dir="ltr"] .theme-classic .homepage-packages-row__features-grid,

html[dir="ltr"] .theme-bold .homepage-packages-row__features-grid {

  direction: ltr;

  text-align: left;

}



html[dir="ltr"] .theme-classic .homepage-packages-row__features-grid li,

html[dir="ltr"] .theme-bold .homepage-packages-row__features-grid li {

  direction: ltr;

  text-align: left;

}



html[dir="ltr"] .theme-classic .homepage-packages-row__action,

html[dir="ltr"] .theme-bold .homepage-packages-row__action {

  text-align: left;

  direction: ltr;

}



html[dir="ltr"] .testimonial-thumb-card {

  padding: 2.15rem 5.25rem 2.15rem 1.5rem;

}



html[dir="ltr"] .testimonial-thumb-card__quote {

  right: auto;

  left: 1.35rem;

}



html[dir="ltr"] .testimonial-thumb-card__thumb {

  left: auto;

  right: -1.15rem;

}



@media (min-width: 768px) and (max-width: 1023px) {

  html[dir="ltr"] .testimonial-thumb-card {

    padding: 1.85rem 4.75rem 1.85rem 1.25rem;

  }

}



html[dir="ltr"] .faq-item summary {

  text-align: left;

}



html[dir="ltr"] .faq-answer {

  text-align: left;

}



html[dir="ltr"] .theme-classic .faq-magazine-layout--with-image,

html[dir="ltr"] .theme-elegant .faq-magazine-layout--with-image {

  direction: ltr;

}



html[dir="ltr"] .theme-classic .faq-magazine-item__heading,

html[dir="ltr"] .theme-elegant .faq-magazine-item__heading {

  direction: ltr;

  text-align: left;

}



html[dir="ltr"] .theme-classic .faq-magazine-item__question,

html[dir="ltr"] .theme-elegant .faq-magazine-item__question,

html[dir="ltr"] .theme-classic .faq-magazine-item__answer,

html[dir="ltr"] .theme-elegant .faq-magazine-item__answer {

  text-align: left;

}



html[dir="ltr"] .theme-modern .faq-accordion--modern,

html[dir="ltr"] .theme-bold .faq-accordion--modern {

  direction: ltr;

}



html[dir="ltr"] .theme-modern .faq-accordion__column,

html[dir="ltr"] .theme-bold .faq-accordion__column {

  direction: ltr;

}



html[dir="ltr"] .theme-modern .faq-item--modern summary,

html[dir="ltr"] .theme-modern .faq-item--modern .faq-item__summary,

html[dir="ltr"] .theme-bold .faq-item--modern summary,

html[dir="ltr"] .theme-bold .faq-item--modern .faq-item__summary {

  direction: ltr;

  text-align: left;

}



html[dir="ltr"] .theme-modern .faq-item--modern .faq-item__question,

html[dir="ltr"] .theme-bold .faq-item--modern .faq-item__question {

  text-align: left;

  direction: ltr;

}



html[dir="ltr"] .bold-hero-content {

  right: auto;

  left: 0;

  text-align: left;

}



html[dir="ltr"] .modern-about-content {

  text-align: left;

}



html[dir="ltr"] #about .max-w-2xl,

html[dir="ltr"] .about-inner .lg\\:col-span-7,

html[dir="ltr"] .theme-bold .about-inner .lg\\:col-span-7 {

  text-align: left;

}



html[dir="ltr"] .site-footer-legal-links {

  flex-direction: row !important;

}



html[dir="ltr"] .hp-posts-header {

  align-items: flex-start;

  text-align: left !important;

}



html[dir="ltr"] .hp-posts-header--with-more {

  flex-direction: row;

}



html[dir="ltr"] .hp-posts-header__titles {

  align-items: flex-start;

  text-align: left !important;

}



html[dir="ltr"] .hp-posts-header--elegant .elegant-section-heading__title {

  direction: ltr;

  text-align: left !important;

  justify-self: start !important;

}



html[dir="ltr"] .hp-posts-header--elegant .hp-posts-header__more .hp-posts-more {

  justify-content: flex-start;

}



html[dir="ltr"] .hp-posts-more a:hover .hp-posts-more-arrow {

  transform: translateX(5px);

}



html[dir="ltr"] .contact-privacy-consent {

  width: 100% !important;

  max-width: 100% !important;

  min-width: 0;

  text-align: left;

}



html[dir="ltr"] .contact-privacy-consent p {

  flex: 1 1 auto;

  min-width: 0;

}



html[dir="ltr"] .theme-classic .classic-contact-form,

html[dir="ltr"] .theme-classic .classic-contact-form__message-block {

  display: flex !important;

  flex-direction: column !important;

  align-items: stretch !important;

  width: 100% !important;

}



html[dir="ltr"] .testimonial-thumb-card__content,

html[dir="ltr"] .testimonial-thumb-card__text,

html[dir="ltr"] .testimonial-thumb-card__footer,

html[dir="ltr"] .testimonial-thumb-card__content h4 {

  text-align: left;

}



html[dir="ltr"] .theme-classic .classic-contact-info,

html[dir="ltr"] .theme-classic .classic-contact-info h2,

html[dir="ltr"] .theme-classic .classic-contact-info p,

html[dir="ltr"] .theme-classic .classic-contact-info span {

  text-align: left;

}



html[dir="ltr"] .theme-classic .classic-contact-details__link,

html[dir="ltr"] .theme-classic .classic-contact-details__item {

  justify-content: flex-start;

}



html[dir="ltr"] .theme-classic .classic-contact-form label,

html[dir="ltr"] .theme-classic .classic-contact-form input,

html[dir="ltr"] .theme-classic .classic-contact-form textarea {

  text-align: left;

}



html[dir="ltr"] #about .elegant-accent,

html[dir="ltr"] .about-section-label {

  text-align: left;

}



html[dir="ltr"] .bold-contact-details__item,

html[dir="ltr"] .elegant-contact-details__item {

  text-align: left;

}

`

