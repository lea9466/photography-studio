export const UNIFIED_GALLERY_GRID_CSS = `

  .homepage-gallery-section {

    width: 100%;

    overflow-x: clip;

    padding-top: 0 !important;

    padding-bottom: 0 !important;

  }

  .homepage-gallery-header {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    margin-bottom: 1rem !important;

    padding-top: calc(1.5rem + 150px);

    padding-inline: 2%;

    text-align: right !important;

    box-sizing: border-box;

  }

  .homepage-gallery-header > div {

    display: flex;

    flex-direction: column;

    align-items: flex-end !important;

    justify-content: flex-start !important;

    text-align: right !important;

    width: 100%;

  }

  .homepage-gallery-header .elegant-section-heading {

    justify-items: end !important;

    text-align: right !important;

  }

  .homepage-gallery-header .text-right,

  .homepage-gallery-header .text-center,

  .recent-photos-header .text-right,

  .recent-photos-header .text-center {

    text-align: right !important;

  }

  @media (min-width: 768px) {

    .homepage-gallery-header {

      padding-top: calc(2rem + 150px);

    }

  }

  .homepage-gallery-grid {

    display: flex;

    flex-wrap: wrap;

    align-items: stretch;

    gap: 3px;

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: 2%;

    background: var(--homepage-gallery-grid-bg, transparent);

  }

  .homepage-gallery-grid.reveal {

    transition-delay: 0.12s;

  }

  .homepage-gallery-reveal {

    opacity: 0;

    transform: translateY(30px);

    transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1);

    will-change: opacity, transform;

  }

  .homepage-gallery-reveal.is-visible {

    opacity: 1;

    transform: translateY(0);

  }

  .homepage-gallery-grid.homepage-gallery-reveal {

    transition-delay: 0.12s;

  }

  @media (min-width: 768px) {

    .homepage-gallery-grid {

      flex-wrap: nowrap;

      gap: 4px;

      height: clamp(360px, calc(100svh - 14rem + 30px), 760px);

    }

  }

  .homepage-gallery-card {

    position: relative;

    display: block;

    flex: 1 1 calc(50% - 1.5px);

    min-width: 0;

    height: calc((100vw * 0.96 - 3px) / 2 * 3 / 2);

    max-height: calc(100svh - 14rem + 30px);

    transition: flex 0.5s ease;

    overflow: hidden;

    background: #eae8e5;

    text-decoration: none;

    cursor: pointer;

  }

  .homepage-gallery-card-media {

    position: absolute;

    inset: 0;

  }

  .homepage-gallery-card:hover,

  .homepage-gallery-card:focus-visible {

    flex: 2.5 1 0;

  }

  @media (min-width: 768px) {

    .homepage-gallery-card {

      flex: 1 1 0;

      height: 100%;

      max-height: none;

    }

  }

  .homepage-gallery-card-image {

    position: absolute;

    inset: 0;

    width: 100%;

    height: 100%;

    object-fit: cover;

  }

  .homepage-gallery-card-overlay {

    position: absolute;

    inset: 0;

    background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 45%, transparent 100%);

    opacity: 0;

    transition: opacity 0.5s ease;

  }

  .homepage-gallery-card-content {

    position: absolute;

    left: 0;

    right: 0;

    bottom: 0;

    padding: 1.25rem 1rem;

    color: #fff;

    opacity: 0;

    transform: translateY(12px);

    transition: opacity 0.5s ease, transform 0.5s ease;

    pointer-events: none;

    text-align: right;

  }

  .homepage-gallery-card-label {

    font-size: 10px;

    letter-spacing: 0.35em;

    text-transform: uppercase;

    opacity: 0.85;

  }

  .homepage-gallery-card-title {

    font-size: 1.35rem;

    margin-top: 0.4rem;

    line-height: 1.1;

  }

  @media (min-width: 768px) {

    .homepage-gallery-card-title { font-size: 1.5rem; }

  }

  .homepage-gallery-card-subtitle {

    font-size: 0.8125rem;

    margin-top: 0.35rem;

    opacity: 0.9;

  }

  .homepage-gallery-card-cta {

    display: inline-flex;

    align-items: center;

    gap: 0.4rem;

    margin-top: 0.85rem;

    font-size: 10px;

    letter-spacing: 0.25em;

    text-transform: uppercase;

  }

  .homepage-gallery-card-arrow {

    transition: transform 0.4s ease;

  }

  .homepage-gallery-card:hover .homepage-gallery-card-overlay,

  .homepage-gallery-card:focus-visible .homepage-gallery-card-overlay { opacity: 1; }

  .homepage-gallery-card:hover .homepage-gallery-card-content,

  .homepage-gallery-card:focus-visible .homepage-gallery-card-content {

    opacity: 1;

    transform: translateY(0);

  }

  .homepage-gallery-card:hover .homepage-gallery-card-arrow { transform: translateX(-4px); }

  @media (hover: none) {

    .homepage-gallery-card-overlay { opacity: 0.55; }

    .homepage-gallery-card-content {

      opacity: 1;

      transform: translateY(0);

    }

  }

  @media (prefers-reduced-motion: reduce) {

    .homepage-gallery-reveal {

      opacity: 1;

      transform: none;

      transition: none;

    }

  }

`



export const HOMEPAGE_PACKAGES_GRID_CSS = `

  .homepage-packages-grid {

    display: grid;

    grid-template-columns: 1fr;

    gap: 2rem;

    justify-content: center;

    justify-items: stretch;

    align-items: stretch;

    width: 100%;

    margin-inline: auto;

  }

  .homepage-packages-grid > * {

    width: 100%;

    min-width: 0;

  }

  @media (min-width: 768px) and (max-width: 1023px) {

    .homepage-packages-grid {

      grid-template-columns: 1fr !important;

      max-width: 36rem;

    }

  }

  @media (min-width: 1024px) {

    .homepage-packages-grid {

      grid-template-columns: repeat(3, minmax(0, 1fr));

    }

    .homepage-packages-grid--count-1 {

      grid-template-columns: minmax(0, 22rem);

      justify-content: center;

    }

    .homepage-packages-grid--count-2 {

      grid-template-columns: repeat(2, minmax(0, 22rem));

      justify-content: center;

    }

  }

`



export const CLASSIC_PACKAGES_ROWS_CSS = `

  .theme-classic .homepage-packages-section, .theme-bold .homepage-packages-section {

    width: 100%;

    max-width: 100%;

    overflow: hidden;

    padding-top: 120px !important;

  }

  .theme-classic .homepage-packages-section {

    background: linear-gradient(
      to bottom,
      #FAFAF8 0%,
      #FAFAF8 56px,
      #FBF9F6 140px,
      #FAF7F4 260px,
      #FAF7F4 calc(100% - 128px),
      #FAFAF8 100%
    );

  }

  .theme-classic .homepage-packages-section__inner, .theme-bold .homepage-packages-section__inner {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: clamp(1.5rem, 5vw, 4rem);

    box-sizing: border-box;

  }

  .theme-classic .homepage-packages-section__header, .theme-bold .homepage-packages-section__header {

    width: 100%;

    text-align: left !important;

    margin-bottom: 2.5rem;

  }

  .theme-classic .homepage-packages-section__header span,
  .theme-bold .homepage-packages-section__header span,

  .theme-classic .homepage-packages-section__header h2,
  .theme-bold .homepage-packages-section__header h2 {

    text-align: left !important;

  }

  .theme-classic .homepage-packages-section__divider, .theme-bold .homepage-packages-section__divider {

    margin-left: 0;

    margin-right: auto;

  }

  .theme-classic .testimonials-section__inner,
  .testimonials-section--modern .testimonials-section__inner,
  .theme-bold .testimonials-section__inner {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: clamp(1.5rem, 5vw, 4rem);

    box-sizing: border-box;

  }

  .theme-classic .testimonials-section__header,
  .theme-bold .testimonials-section__header {

    width: 100%;

    text-align: left !important;

    margin-bottom: 2.5rem;

  }

  .testimonials-section--modern .testimonials-section__header {

    width: 100%;

    text-align: center !important;

    margin-bottom: 2.5rem;

  }

  .theme-classic .testimonials-section__header span,
  .theme-bold .testimonials-section__header span,

  .theme-classic .testimonials-section__header h2,
  .theme-bold .testimonials-section__header h2 {

    text-align: left !important;

  }

  .testimonials-section--modern .testimonials-section__header span,
  .testimonials-section--modern .testimonials-section__header h2 {

    text-align: center !important;

  }

  .theme-classic .testimonials-section__divider,
  .testimonials-section--modern .testimonials-section__divider,
  .theme-bold .testimonials-section__divider {

    margin-left: 0;

    margin-right: auto;

  }

  .theme-classic .faq-section__header {

    width: 100%;

    text-align: left !important;

    margin-bottom: 2.5rem;

    padding-inline: 2%;

    box-sizing: border-box;

  }

  .theme-classic .faq-section__header span,

  .theme-classic .faq-section__header h2,

  .theme-classic .faq-section__header p {

    text-align: left !important;

  }

  .theme-classic .faq-section__divider {

    margin-left: 0;

    margin-right: auto;

  }

  .theme-classic .homepage-packages-rows, .theme-bold .homepage-packages-rows {

    display: flex;

    flex-direction: column;

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

  }

  .theme-classic .homepage-packages-row, .theme-bold .homepage-packages-row {

    display: grid;

    grid-template-columns: auto auto 1fr;

    align-items: center;

    column-gap: 0;

    padding: 2rem 0;

    border-bottom: 1px solid #e2e2e2;

    direction: rtl;

    text-align: right;

    width: 100%;

    overflow: visible;

  }

  .theme-classic .homepage-packages-row:last-child, .theme-bold .homepage-packages-row:last-child {

    border-bottom: none;

  }

  .theme-classic .homepage-packages-row--featured, .theme-bold .homepage-packages-row--featured {

    background: rgba(250, 246, 240, 0.88);

    border-radius: 2px;

  }

  .theme-classic .homepage-packages-row__title, .theme-bold .homepage-packages-row__title {

    grid-column: 1;

    justify-self: end;

    flex: 0 0 auto;

    width: auto;

    min-width: 9rem;

    max-width: 14rem;

    text-align: right;

    padding: 0;

    position: relative;

  }

  .theme-classic .homepage-packages-row__title h3,
  .theme-bold .homepage-packages-row__title h3,

  .theme-classic .homepage-packages-row__title p,
  .theme-bold .homepage-packages-row__title p {

    text-align: right;

    direction: rtl;

  }

  .theme-classic .homepage-packages-row__title h3, .theme-bold .homepage-packages-row__title h3 {

    font-weight: 600;

  }

  .theme-classic .homepage-packages-row__badge, .theme-bold .homepage-packages-row__badge {

    position: absolute;

    top: -1.35rem;

    right: 0;

    left: auto;

    display: inline-block;

    background: var(--primary-color, #8b6f5c);

    color: #ffffff;

    padding: 0.2rem 0.65rem;

    font-size: 0.65rem;

    font-weight: 600;

    text-transform: uppercase;

    letter-spacing: 0.08em;

    border-radius: 2px;

    margin-bottom: 0;

    white-space: nowrap;

  }

  .theme-classic .homepage-packages-row__features, .theme-bold .homepage-packages-row__features {

    grid-column: 2;

    justify-self: start;

    margin-inline-start: 5rem;

    flex: 0 0 auto;

    min-width: 0;

    width: 100%;

    max-width: 36rem;

    text-align: right;

    direction: rtl;

  }

  .theme-classic .homepage-packages-row__features-grid, .theme-bold .homepage-packages-row__features-grid {

    display: grid;

    grid-template-columns: repeat(2, minmax(150px, 1fr));

    gap: 12px 24px;

    list-style: none;

    padding: 0;

    margin: 0;

    direction: rtl;

    text-align: right;

    width: 100%;

    max-width: 100%;

  }

  .theme-classic .homepage-packages-row__features-grid li, .theme-bold .homepage-packages-row__features-grid li {

    display: flex;

    align-items: center;

    justify-content: flex-start;

    gap: 8px;

    direction: rtl;

    text-align: right;

    font-size: 0.9rem;

    color: rgba(45, 40, 37, 0.75);

    white-space: nowrap;

    width: 100%;

    min-width: 0;

  }

  .theme-classic .homepage-packages-row__features-grid li > span:not(.material-symbols-outlined), .theme-bold .homepage-packages-row__features-grid li > span:not(.material-symbols-outlined) {

    min-width: 0;

    direction: rtl;

    text-align: right;

  }

  .theme-classic .homepage-packages-row__features-grid .material-symbols-outlined, .theme-bold .homepage-packages-row__features-grid .material-symbols-outlined {

    font-size: 1.1rem;

    color: var(--primary-color, #8b6f5c);

    flex-shrink: 0;

    line-height: 1;

  }

  .theme-classic .homepage-packages-row__action, .theme-bold .homepage-packages-row__action {

    grid-column: 3;

    justify-self: end;

    flex: 0 0 auto;

    display: flex;

    flex-direction: column;

    align-items: center;

    gap: 0.75rem;

    min-width: 9rem;

    margin: 0;

  }

  .theme-classic .homepage-packages-row__price, .theme-bold .homepage-packages-row__price {

    font-size: 2rem;

    font-weight: 700;

    color: var(--primary-color, #8b6f5c);

    display: flex;

    align-items: baseline;

    gap: 0.15rem;

    direction: ltr;

  }

  .theme-classic .homepage-packages-row__price-currency, .theme-bold .homepage-packages-row__price-currency {

    font-size: 1rem;

    font-weight: 400;

  }

  .theme-classic .homepage-packages-row__btn, .theme-bold .homepage-packages-row__btn {

    white-space: nowrap;

    padding: 0.65rem 1.25rem;

    font-size: 0.75rem;

    font-weight: 600;

    letter-spacing: 0.04em;

    border-radius: 2px;

    transition: all 0.3s ease;

    cursor: pointer;

  }

  .theme-classic .homepage-packages-row__btn--featured, .theme-bold .homepage-packages-row__btn--featured {

    background: var(--primary-color, #8b6f5c);

    color: #ffffff;

    border: none;

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  }

  .theme-classic .homepage-packages-row__btn--featured:hover, .theme-bold .homepage-packages-row__btn--featured:hover {

    filter: brightness(1.08);

  }

  .theme-classic .homepage-packages-row__btn--default, .theme-bold .homepage-packages-row__btn--default {

    background: transparent;

    color: var(--primary-color, #8b6f5c);

    border: 1px solid rgba(139, 111, 92, 0.4);

  }

  .theme-classic .homepage-packages-row__btn--default:hover, .theme-bold .homepage-packages-row__btn--default:hover {

    background: var(--primary-color, #8b6f5c);

    color: #ffffff;

  }

  @media (max-width: 767px) {

    .theme-classic .homepage-packages-section, .theme-bold .homepage-packages-section {

      padding-top: 100px !important;

    }

    .theme-classic .homepage-packages-section {

      background: linear-gradient(
        to bottom,
        #FAFAF8 0%,
        #FAFAF8 40px,
        #FBF9F6 110px,
        #FAF7F4 210px,
        #FAF7F4 calc(100% - 96px),
        #FAFAF8 100%
      );

    }

    .theme-classic .homepage-packages-section__inner, .theme-bold .homepage-packages-section__inner {

      padding-inline: clamp(1rem, 4vw, 1.5rem);

    }

    .theme-classic .homepage-packages-row, .theme-bold .homepage-packages-row {

      display: flex;

      flex-direction: column;

      align-items: stretch;

      justify-content: flex-start;

      gap: 1.25rem;

      padding: 1.5rem 0;

      direction: rtl;

    }

    .theme-classic .homepage-packages-row__title, .theme-bold .homepage-packages-row__title {

      grid-column: auto;

      justify-self: stretch;

      flex: none;

      width: 100%;

      min-width: 0;

      max-width: none;

      text-align: right;

    }

    .theme-classic .homepage-packages-row__features, .theme-bold .homepage-packages-row__features {

      grid-column: auto;

      justify-self: start;

      margin-inline-start: 0;

      width: 100%;

    }

    .theme-classic .homepage-packages-row__features-grid, .theme-bold .homepage-packages-row__features-grid {

      grid-template-columns: 1fr;

      gap: 12px;

      width: 100%;

      max-width: 100%;

    }

    .theme-classic .homepage-packages-row__features-grid li, .theme-bold .homepage-packages-row__features-grid li {

      white-space: normal;

      width: 100%;

      max-width: 100%;

    }

    .theme-classic .homepage-packages-row__badge, .theme-bold .homepage-packages-row__badge {

      position: static;

      margin-bottom: 0.5rem;

    }

    .theme-classic .homepage-packages-row__action, .theme-bold .homepage-packages-row__action {

      grid-column: auto;

      justify-self: stretch;

      flex-direction: row;

      justify-content: space-between;

      align-items: center;

      width: 100%;

      min-width: 0;

      margin-left: 0;

    }

    .theme-classic .homepage-packages-row__btn, .theme-bold .homepage-packages-row__btn {

      flex-shrink: 0;

    }

  }

`

export const BOLD_PACKAGES_ROWS_CSS = `

  .theme-bold .homepage-packages-section {
    background: linear-gradient(
      to bottom,
      #121217 0%,
      #121217 56px,
      #14141b 140px,
      #171720 240px,
      #1a1a22 320px,
      #1a1a22 calc(100% - 128px),
      #121217 100%
    );
  }

  .theme-bold .homepage-packages-row {
    border-bottom-color: rgba(255, 255, 255, 0.12);
  }

  .theme-bold .homepage-packages-row--featured {
    background: rgba(255, 255, 255, 0.04);
  }

  .theme-bold .homepage-packages-row__features-grid li {
    color: rgba(245, 245, 240, 0.75);
  }

  .theme-bold .homepage-packages-row__btn--default {
    border-color: rgba(255, 255, 255, 0.28);
  }

  @media (max-width: 767px) {
    .theme-bold .homepage-packages-section {
      background: linear-gradient(
        to bottom,
        #121217 0%,
        #121217 40px,
        #14141b 110px,
        #171720 200px,
        #1a1a22 280px,
        #1a1a22 calc(100% - 96px),
        #121217 100%
      );
    }
  }

`



export const POSTS_PACKAGES_TRANSITION_CSS = `

  .hp-posts-section {
    position: relative;
  }

  .hp-posts-section::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 72px;
    pointer-events: none;
  }

  .theme-elegant .hp-posts-section::after {
    background: linear-gradient(to bottom, transparent 0%, rgba(253, 248, 247, 0.55) 100%);
  }

  .theme-modern .hp-posts-section::after {
    background: linear-gradient(to bottom, transparent 0%, rgba(248, 250, 252, 0.7) 100%);
  }

  .theme-classic .hp-posts-section::after {
    background: linear-gradient(to bottom, transparent 0%, rgba(250, 247, 244, 0.62) 100%);
  }

  .theme-bold .hp-posts-section::after {
    background: linear-gradient(to bottom, transparent 0%, rgba(26, 26, 34, 0.58) 100%);
  }

  .homepage-packages-section .about-glow {
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 22%, rgba(0,0,0,0.62) 50%, #000 76%, #000 84%, rgba(0,0,0,0.45) 93%, transparent 100%);
    mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 22%, rgba(0,0,0,0.62) 50%, #000 76%, #000 84%, rgba(0,0,0,0.45) 93%, transparent 100%);
  }

  .homepage-packages-section .about-glow-left {
    opacity: 0.56;
  }

  .homepage-packages-section .about-glow-right {
    opacity: 0.6;
  }

  .theme-elegant #pricing > [aria-hidden="true"],
  .theme-modern #pricing > [aria-hidden="true"] {
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 24%, rgba(0,0,0,0.64) 54%, #000 72%, #000 82%, rgba(0,0,0,0.42) 92%, transparent 100%);
    mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 24%, rgba(0,0,0,0.64) 54%, #000 72%, #000 82%, rgba(0,0,0,0.42) 92%, transparent 100%);
  }

  .theme-elegant #pricing::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 128px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to bottom, #fdf8f7 0%, rgba(253, 248, 247, 0.82) 38%, transparent 100%);
  }

  .theme-elegant #pricing::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 128px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to top, #fdf8f7 0%, rgba(253, 248, 247, 0.82) 38%, transparent 100%);
  }

  .theme-modern #pricing {
    position: relative;
  }

  .theme-modern #pricing::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 96px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to bottom, #F8FAFC 0%, rgba(248, 250, 252, 0.76) 44%, transparent 100%);
  }

  .theme-modern #pricing::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 96px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to top, #F8FAFC 0%, rgba(248, 250, 252, 0.76) 44%, transparent 100%);
  }

  .theme-classic .homepage-packages-section::after,
  .theme-bold .homepage-packages-section::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 128px;
    pointer-events: none;
    z-index: 1;
  }

  .theme-classic .homepage-packages-section::after {
    background: linear-gradient(to top, #FAFAF8 0%, rgba(250, 250, 248, 0.72) 42%, transparent 100%);
  }

  .theme-bold .homepage-packages-section::after {
    background: linear-gradient(to top, #121217 0%, rgba(18, 18, 23, 0.72) 42%, transparent 100%);
  }

  @media (max-width: 767px) {
    .theme-elegant #pricing::after,
    .theme-modern #pricing::after,
    .theme-elegant #pricing::before,
    .theme-modern #pricing::before,
    .theme-classic .homepage-packages-section::after,
    .theme-bold .homepage-packages-section::after {
      height: 96px;
    }
  }

`



export const RECENT_PHOTOS_GRID_CSS = `

  .recent-photos-section {

    width: 100%;

    overflow: hidden;

    padding-top: calc(2rem + 50px) !important;

    padding-bottom: 1.5rem !important;

  }

  @media (min-width: 768px) {

    .recent-photos-section {

      padding-top: calc(3rem + 50px) !important;

      padding-bottom: 2rem !important;

    }

  }

  .recent-photos-header {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    margin-bottom: 1rem;

    padding-inline: 2%;

    text-align: right !important;

    box-sizing: border-box;

  }

  .recent-photos-header > div:not(.hp-posts-header--classic) {

    display: flex;

    flex-direction: column;

    align-items: flex-end !important;

    justify-content: flex-start !important;

    text-align: right !important;

    width: 100%;

  }

  .recent-photos-header .elegant-section-heading {

    justify-items: end !important;

    text-align: right !important;

  }

  .portfolio-cta-wrap {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: 2%;

    padding-bottom: 0;

    box-sizing: border-box;

  }

  .recent-photos-header > div:not(.hp-posts-header--classic):has(.portfolio-cta-wrap) {

    flex-direction: row-reverse !important;

    justify-content: space-between !important;

    align-items: flex-end !important;

  }

  .recent-photos-header .portfolio-cta-wrap {

    padding-inline: 0;

    width: auto;

    flex-shrink: 0;

  }

  .recent-photos-header .portfolio-cta-wrap .hp-posts-more {

    margin-top: 0;

  }

  .recent-photos-grid {

    display: grid;

    grid-template-columns: repeat(1, 1fr);

    gap: 3px;

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: 2%;

  }

  @media (min-width: 640px) {

    .recent-photos-grid {

      grid-template-columns: repeat(2, 1fr);

      gap: 4px;

    }

  }

  @media (min-width: 768px) {

    .recent-photos-grid {

      grid-template-columns: repeat(3, 1fr);

    }

  }

  @media (min-width: 1024px) {

    .recent-photos-grid {

      grid-template-columns: repeat(4, 1fr);

    }

  }

  .recent-photo-cell {

    position: relative;

    display: block;

    aspect-ratio: 4 / 3;

    overflow: hidden;

    background: #eae8e5;

    text-decoration: none;

    opacity: 0;

    transform: scale(0.82);

    transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.2, 0, 0.2, 1);

    will-change: opacity, transform;

  }

  .recent-photo-cell.is-visible {

    opacity: 1;

    transform: scale(1);

  }

  .recent-photo-img {

    position: absolute;

    inset: 0;

    width: 100%;

    height: 100%;

    object-fit: cover;

    transition: transform 1s ease-out;

  }

  .recent-photo-cell:hover .recent-photo-img { transform: scale(1.06); }

  /* Theme radius variants (mirror the gallery cards) */

  .recent-photos-grid--elegant .recent-photo-cell { border-radius: 0px; }

  .recent-photos-grid--modern .recent-photo-cell { border-radius: 12px; }

  .recent-photos-grid--classic .recent-photo-cell { border-radius: 4px; }

  .recent-photos-grid--dark .recent-photo-cell { border-radius: 0px; }

`

export const CLASSIC_RECENT_PHOTOS_HEADER_CSS = `

  .theme-classic .recent-photos-header {
    margin-bottom: 2.5rem;
    text-align: left !important;
    direction: ltr;
  }

  .theme-classic .recent-photos-header > .hp-posts-header.hp-posts-header--classic {
    display: flex;
    flex-direction: row !important;
    justify-content: space-between;
    align-items: center !important;
    width: 100%;
    max-width: 100%;
    padding-inline: 0;
    margin-bottom: 0;
    text-align: left !important;
    direction: ltr;
    box-sizing: border-box;
  }

  .theme-classic .recent-photos-header .hp-posts-header__titles {
    display: flex;
    flex-direction: column;
    align-items: flex-start !important;
    text-align: left !important;
    order: 1;
    min-width: 0;
  }

  .theme-classic .recent-photos-header .hp-posts-eyebrow,
  .theme-classic .recent-photos-header .classic-section-script,
  .theme-classic .recent-photos-header .hp-posts-title {
    text-align: left !important;
  }

  .theme-classic .recent-photos-header .classic-section-script {
    display: block;
    margin-bottom: 0.15rem;
  }

  .theme-classic .recent-photos-header .hp-posts-eyebrow {
    display: block;
    font-size: 13px;
    letter-spacing: 0.02em;
    text-transform: none;
    margin-bottom: 4px;
  }

  .theme-classic .recent-photos-header .hp-posts-title {
    margin: 0;
  }

  .theme-classic .recent-photos-header .hp-posts-divider {
    width: 56px;
    height: 1px;
    margin: 8px 0 0;
    margin-left: 0;
    margin-right: auto;
  }

  .theme-classic .recent-photos-header .hp-posts-header__more {
    order: 2;
    margin-left: auto;
    flex-shrink: 0;
  }

  .theme-classic .recent-photos-header .hp-posts-header__more .hp-posts-more,
  .theme-classic .recent-photos-header .hp-posts-header__more .portfolio-cta-wrap .hp-posts-more {
    margin-top: 0;
    justify-content: flex-end;
  }

  .theme-classic .recent-photos-header .hp-posts-header__more .portfolio-cta-wrap {
    padding-inline: 0;
    width: auto;
  }

  @media (max-width: 767px) {
    .theme-classic .recent-photos-header {
      text-align: left !important;
    }

    .theme-classic .recent-photos-header > .hp-posts-header.hp-posts-header--classic {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 1rem;
      direction: ltr;
    }

    .theme-classic .recent-photos-header .hp-posts-header__more {
      align-self: flex-end;
      margin-left: 0;
    }
  }

`

/** Must load AFTER shared gallery/recent header CSS (which forces RTL right-align). */
export const MODERN_SECTION_ALIGN_CSS = `
  .theme-modern .modern-section-heading {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    justify-content: flex-start !important;
    gap: 0.35rem;
    width: 100%;
    max-width: 100%;
    text-align: left !important;
    direction: ltr !important;
  }
  .theme-modern .modern-section-eyebrow,
  .theme-modern .modern-section-heading .modern-section-eyebrow {
    display: block !important;
    width: 100%;
    text-align: left !important;
    direction: ltr !important;
  }
  .theme-modern .modern-section-heading h1,
  .theme-modern .modern-section-heading h2,
  .theme-modern .homepage-gallery-header h2,
  .theme-modern .recent-photos-header h2,
  .theme-modern #posts h2,
  .theme-modern .homepage-gallery-header .modern-section-subtitle,
  .theme-modern .recent-photos-header .modern-section-subtitle {
    text-align: left !important;
  }
  .theme-modern .modern-section-heading h1,
  .theme-modern .modern-section-heading h2,
  .theme-modern .homepage-gallery-header h2,
  .theme-modern .recent-photos-header h2,
  .theme-modern #posts h2 {
    width: 100%;
    max-width: 100%;
    margin-inline: 0 !important;
    direction: rtl;
  }
  /* Packages / testimonials / FAQ: centered section titles */
  .theme-modern #pricing .modern-section-heading,
  .theme-modern #testimonials .modern-section-heading,
  .theme-modern #faq .modern-section-heading,
  .theme-modern .testimonials-section--modern .testimonials-section__header .modern-section-heading {
    align-items: center !important;
    text-align: center !important;
  }
  .theme-modern #pricing .modern-section-eyebrow,
  .theme-modern #testimonials .modern-section-eyebrow,
  .theme-modern #faq .modern-section-eyebrow,
  .theme-modern #pricing .modern-section-heading h2,
  .theme-modern #testimonials .modern-section-heading h2,
  .theme-modern #faq .modern-section-heading h2,
  .theme-modern #pricing .modern-section-subtitle,
  .theme-modern #faq .modern-section-subtitle,
  .theme-modern #pricing .text-center,
  .theme-modern #faq .text-center,
  .theme-modern .testimonials-section--modern .testimonials-section__header {
    text-align: center !important;
  }
  .theme-modern #pricing .modern-section-heading h2,
  .theme-modern #testimonials .modern-section-heading h2,
  .theme-modern #faq .modern-section-heading h2 {
    width: 100%;
    max-width: 100%;
    margin-inline: 0 !important;
    direction: rtl;
  }
  .theme-modern .homepage-gallery-header,
  .theme-modern .recent-photos-header,
  .theme-modern .homepage-gallery-header > div,
  .theme-modern .recent-photos-header > div,
  .theme-modern .recent-photos-header > div:not(.hp-posts-header--classic),
  .theme-modern .recent-photos-header > div:not(.hp-posts-header--classic):has(.portfolio-cta-wrap),
  .theme-modern .homepage-gallery-header .text-left,
  .theme-modern .recent-photos-header .text-left {
    text-align: left !important;
    align-items: flex-start !important;
  }
  .theme-modern .recent-photos-header > div:not(.hp-posts-header--classic):has(.portfolio-cta-wrap),
  .theme-modern .homepage-gallery-header > div {
    flex-direction: row !important;
    justify-content: space-between !important;
  }
  /* Recent photos: titles left, "view all" CTA pinned right */
  .theme-modern .recent-photos-header--modern,
  .theme-modern .recent-photos-header--modern .recent-photos-header__row {
    display: flex !important;
    flex-direction: row !important;
    direction: ltr !important;
    justify-content: space-between !important;
    align-items: flex-end !important;
    gap: 1rem;
    width: 100%;
    text-align: left !important;
  }
  .theme-modern .recent-photos-header--modern .recent-photos-header__titles {
    flex: 1 1 auto;
    min-width: 0;
    width: auto !important;
    max-width: none;
    text-align: left !important;
  }
  .theme-modern .recent-photos-header--modern .portfolio-cta-wrap {
    flex: 0 0 auto;
    width: auto !important;
    margin-inline-start: auto;
    margin-inline-end: 0;
    padding-inline: 0;
    align-self: flex-end;
  }
  .theme-modern .recent-photos-header--modern .portfolio-cta-wrap .hp-posts-more {
    justify-content: flex-end;
    margin-top: 0;
  }
  .theme-modern .modern-about-content {
    text-align: right !important;
    direction: rtl !important;
  }
  .theme-modern .modern-about-content .modern-section-eyebrow {
    text-align: right !important;
    direction: ltr !important;
  }
  .theme-modern .modern-about-content h1,
  .theme-modern .modern-about-content p {
    text-align: right !important;
    direction: rtl !important;
  }
  .theme-modern .modern-about-content .modern-about-actions {
    direction: rtl !important;
    justify-content: flex-start !important;
  }
  .theme-modern #contact .modern-contact-info,
  .theme-modern #contact .modern-contact-info .modern-section-heading,
  .theme-modern #contact .modern-contact-info .modern-section-heading h2,
  .theme-modern #contact .modern-contact-info h2,
  .theme-modern #contact .modern-contact-info > p {
    text-align: right !important;
    direction: rtl;
  }
  .theme-modern #contact .modern-contact-info .modern-section-heading {
    align-items: flex-end !important;
    text-align: right !important;
    direction: rtl !important;
  }
  .theme-modern #contact .modern-contact-info .modern-section-eyebrow {
    text-align: right !important;
    direction: ltr !important;
    width: 100%;
  }
`

export const HOMEPAGE_REVEAL_INIT_SCRIPT = `

(function initHomepageReveal() {

  var observerOptions = { threshold: 0.08, rootMargin: '0px 0px 8% 0px' };

  var observer = new IntersectionObserver(function(entries) {

    entries.forEach(function(entry) {

      if (entry.isIntersecting) entry.target.classList.add('active');

    });

  }, observerOptions);



  function observeRevealElements() {

    document.querySelectorAll('.reveal:not(.active)').forEach(function(el) {

      observer.observe(el);

    });

  }



  function activateRevealElementsInView() {

    document.querySelectorAll('.reveal:not(.active)').forEach(function(el) {

      var rect = el.getBoundingClientRect();

      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {

        el.classList.add('active');

      }

    });

  }



  function boot() {

    observeRevealElements();

    activateRevealElementsInView();

    window.addEventListener('scroll', activateRevealElementsInView, { passive: true });

    window.addEventListener('resize', activateRevealElementsInView);

  }



  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', boot);

  } else {

    boot();

  }

  window.addEventListener('load', activateRevealElementsInView);

})();

`



export const HOMEPAGE_GALLERY_REVEAL_SCRIPT = `

(function initHomepageGalleryReveal() {

  function boot() {

    var targets = [].slice.call(document.querySelectorAll('.homepage-gallery-reveal'));

    if (!targets.length) return;

    function revealTarget(el) {

      if (!el.classList.contains('is-visible')) el.classList.add('is-visible');

    }

    function revealTargetsInView() {

      var viewportBottom = window.innerHeight;

      targets.forEach(function(el) {

        var rect = el.getBoundingClientRect();

        if (rect.top < viewportBottom && rect.bottom > 0) {

          revealTarget(el);

        }

      });

    }

    if (!('IntersectionObserver' in window)) {

      targets.forEach(revealTarget);

      return;

    }

    var observer = new IntersectionObserver(function(entries) {

      entries.forEach(function(entry) {

        if (entry.isIntersecting) revealTarget(entry.target);

      });

    }, { threshold: 0.01, rootMargin: '80px 0px 80px 0px' });

    targets.forEach(function(el) { observer.observe(el); });

    revealTargetsInView();

    window.addEventListener('scroll', revealTargetsInView, { passive: true });

    window.addEventListener('resize', revealTargetsInView);

    window.addEventListener('load', revealTargetsInView);

    window.setTimeout(revealTargetsInView, 120);

    window.setTimeout(function() {

      targets.forEach(function(el) {

        if (!el.classList.contains('is-visible')) revealTarget(el);

      });

    }, 1800);

  }

  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', boot);

  } else {

    boot();

  }

})();

`



export const RECENT_PHOTOS_REVEAL_SCRIPT = `

(function initRecentPhotosReveal() {

  function boot() {

    var cells = [].slice.call(document.querySelectorAll('.recent-photo-cell'));

    if (!cells.length) return;

    if (!('IntersectionObserver' in window)) {

      cells.forEach(function(c) { c.classList.add('is-visible'); });

      return;

    }

    var observer = new IntersectionObserver(function(entries) {

      entries.forEach(function(entry) {

        if (!entry.isIntersecting) return;

        var cell = entry.target;

        var delay = parseInt(cell.getAttribute('data-reveal-delay') || '0', 10);

        setTimeout(function() { cell.classList.add('is-visible'); }, delay);

        observer.unobserve(cell);

      });

    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    cells.forEach(function(c) { observer.observe(c); });

  }

  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', boot);

  } else {

    boot();

  }

})();

`



export const FAQ_ACCORDION_CSS = `

  .faq-section {

    width: 100%;

  }

  .faq-accordion {

    display: flex;

    flex-direction: column;

    gap: 0.75rem;

    max-width: 42rem;

    margin-inline: auto;

    interpolate-size: allow-keywords;

  }

  .faq-item {

    border: 1px solid rgba(0, 0, 0, 0.1);

    border-radius: 0.75rem;

    overflow: hidden;

    background: #ffffff;

  }

  .faq-item summary {

    cursor: pointer;

    padding: 1rem 1.25rem;

    list-style: none;

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 1rem;

    font-weight: 500;

    text-align: right;

  }

  .faq-item summary::-webkit-details-marker {

    display: none;

  }

  .faq-item summary::after {

    content: '+';

    font-size: 1.25rem;

    line-height: 1;

    flex-shrink: 0;

    transition: transform 0.3s ease;

  }

  .faq-item[open] summary::after {

    content: '−';

  }

  /* Modern browsers: smoothly animate the collapsible height */

  .faq-item::details-content {

    block-size: 0;

    overflow: hidden;

    transition: block-size 0.35s ease, content-visibility 0.35s ease allow-discrete;

  }

  .faq-item[open]::details-content {

    block-size: auto;

  }

  /* Fallback (and complement): fade + slide the answer in on open */

  @keyframes faqAnswerReveal {

    from {

      opacity: 0;

      transform: translateY(-0.5rem);

    }

    to {

      opacity: 0.85;

      transform: translateY(0);

    }

  }

  .faq-item[open] .faq-answer {

    animation: faqAnswerReveal 0.35s ease both;

  }

  @media (prefers-reduced-motion: reduce) {

    .faq-item::details-content,

    .faq-item summary::after {

      transition: none;

    }

    .faq-item[open] .faq-answer {

      animation: none;

    }

  }

  .faq-answer {

    padding: 0 1.25rem 1rem;

    line-height: 1.7;

    white-space: pre-line;

    opacity: 0.85;

    border-top: 1px solid rgba(0, 0, 0, 0.06);

    padding-top: 0.75rem;

    margin: 0 1.25rem 1rem;

  }

  .faq-item--dark {

    background: rgba(255, 255, 255, 0.04);

    border-color: rgba(255, 255, 255, 0.12);

  }

  .faq-item--dark .faq-answer {

    border-top-color: rgba(255, 255, 255, 0.1);

  }

`

export const MODERN_FAQ_ACCORDION_CSS = `

  .theme-modern .faq-accordion--modern,
  .theme-bold .faq-accordion--modern {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0 60px;
    direction: rtl;
    width: 100%;
    max-width: 100%;
    margin-inline: 0;
    interpolate-size: allow-keywords;
  }

  .theme-modern .faq-accordion__column,
  .theme-bold .faq-accordion__column {
    display: flex;
    flex-direction: column;
    direction: rtl;
    min-width: 0;
  }

  .theme-modern .faq-item--modern,
  .theme-bold .faq-item--modern {
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    overflow: hidden;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .theme-bold .faq-item--modern {
    border-bottom-color: rgba(255, 255, 255, 0.12);
  }

  .theme-modern .faq-item--modern summary,
  .theme-modern .faq-item--modern .faq-item__summary,
  .theme-bold .faq-item--modern summary,
  .theme-bold .faq-item--modern .faq-item__summary {
    cursor: pointer;
    padding: 1.5rem 0;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    direction: rtl;
    width: 100%;
    font-weight: 500;
    text-align: right;
  }

  .theme-modern .faq-item--modern summary::-webkit-details-marker,
  .theme-bold .faq-item--modern summary::-webkit-details-marker {
    display: none;
  }

  .theme-modern .faq-item--modern summary::after,
  .theme-bold .faq-item--modern summary::after {
    content: none;
    display: none;
  }

  .theme-modern .faq-item--modern .faq-item__question,
  .theme-bold .faq-item--modern .faq-item__question {
    flex: 1;
    min-width: 0;
    text-align: right;
    direction: rtl;
  }

  .theme-modern .faq-item--modern .faq-item__toggle,
  .theme-bold .faq-item--modern .faq-item__toggle {
    flex-shrink: 0;
    align-self: center;
    font-size: 1.25rem;
    line-height: 1;
    transition: transform 0.3s ease;
  }

  .theme-modern .faq-item--modern .faq-item__toggle::before,
  .theme-bold .faq-item--modern .faq-item__toggle::before {
    content: '+';
  }

  .theme-modern .faq-item--modern[open] .faq-item__toggle::before,
  .theme-bold .faq-item--modern[open] .faq-item__toggle::before {
    content: '−';
  }

  .theme-modern .faq-item--modern::details-content,
  .theme-bold .faq-item--modern::details-content {
    block-size: 0;
    overflow: hidden;
    transition: block-size 0.35s ease, content-visibility 0.35s ease allow-discrete;
  }

  .theme-modern .faq-item--modern[open]::details-content,
  .theme-bold .faq-item--modern[open]::details-content {
    block-size: auto;
  }

  .theme-modern .faq-item--modern[open] .faq-answer,
  .theme-bold .faq-item--modern[open] .faq-answer {
    animation: faqAnswerReveal 0.35s ease both;
  }

  .theme-modern .faq-item--modern .faq-answer,
  .theme-bold .faq-item--modern .faq-answer {
    width: 100%;
    padding: 0 0 1.5rem;
    line-height: 1.7;
    white-space: pre-line;
    opacity: 0.85;
    text-align: right;
    direction: rtl;
    border-top: none;
    margin: 0;
    box-sizing: border-box;
  }

  @media (max-width: 767px) {
    .theme-modern .faq-accordion--modern,
    .theme-bold .faq-accordion--modern {
      grid-template-columns: 1fr;
      gap: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-modern .faq-item--modern::details-content,
    .theme-modern .faq-item--modern .faq-item__toggle,
    .theme-bold .faq-item--modern::details-content,
    .theme-bold .faq-item--modern .faq-item__toggle {
      transition: none;
    }

    .theme-modern .faq-item--modern[open] .faq-answer,
    .theme-bold .faq-item--modern[open] .faq-answer {
      animation: none;
    }
  }

`



export const FAQ_SECTION_GLOW_CSS = `

  .theme-modern #faq,
  .theme-bold #faq {
    position: relative;
  }

  .faq-section-glow {
    position: absolute;
    top: 0;
    bottom: 0;
    width: min(26rem, 48vw);
    pointer-events: none;
    z-index: 0;
    filter: blur(72px);
    opacity: 0.66;
  }

  .faq-section-glow--left {
    left: 0;
    transform: translateX(-44%);
  }

  .faq-section-glow--right {
    right: 0;
    transform: translateX(44%);
  }

  .theme-modern #faq .faq-section-glow,
  .theme-bold #faq .faq-section-glow {
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.08) 14%, rgba(0,0,0,0.34) 32%, rgba(0,0,0,0.56) 50%, rgba(0,0,0,0.56) 68%, rgba(0,0,0,0.26) 86%, transparent 100%);
    mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.08) 14%, rgba(0,0,0,0.34) 32%, rgba(0,0,0,0.56) 50%, rgba(0,0,0,0.56) 68%, rgba(0,0,0,0.26) 86%, transparent 100%);
  }

  .theme-modern #faq::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 120px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to bottom, #F8FAFC 0%, rgba(248, 250, 252, 0.82) 28%, rgba(248, 250, 252, 0.34) 58%, transparent 100%);
  }

  .theme-modern #faq::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 120px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to top, #F8FAFC 0%, rgba(248, 250, 252, 0.82) 28%, rgba(248, 250, 252, 0.34) 58%, transparent 100%);
  }

  .theme-bold #faq::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 120px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to bottom, #121217 0%, rgba(18, 18, 23, 0.82) 28%, rgba(18, 18, 23, 0.34) 58%, transparent 100%);
  }

  .theme-bold #faq::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 120px;
    pointer-events: none;
    z-index: 1;
    background: linear-gradient(to top, #121217 0%, rgba(18, 18, 23, 0.82) 28%, rgba(18, 18, 23, 0.34) 58%, transparent 100%);
  }

`



export function magazineFaqGridCss(primaryColor: string) {

  return `

  .theme-classic .faq-magazine-wrap,

  .theme-elegant .faq-magazine-wrap {

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding-inline: 2%;

    box-sizing: border-box;

  }

  .theme-classic .faq-magazine-layout--with-image,

  .theme-elegant .faq-magazine-layout--with-image {

    display: grid;

    grid-template-columns: 1.2fr 1fr;

    gap: 60px;

    direction: rtl;

    align-items: start;

    width: 100%;

  }

  .theme-classic .faq-magazine-content,

  .theme-elegant .faq-magazine-content {

    min-width: 0;

    width: 100%;

  }

  .theme-classic .faq-magazine-feature,

  .theme-elegant .faq-magazine-feature {

    min-width: 0;

    width: 100%;

    align-self: stretch;

    min-height: 100%;

  }

  .theme-classic .faq-magazine-feature__image,

  .theme-elegant .faq-magazine-feature__image {

    width: 100%;

    height: 100%;

    min-height: clamp(20rem, 52vh, 36rem);

    object-fit: cover;

    border-radius: 12px;

    display: block;

  }

  .theme-classic .faq-magazine-layout--with-image .faq-magazine-grid,

  .theme-elegant .faq-magazine-layout--with-image .faq-magazine-grid {

    grid-template-columns: 1fr;

    gap: 50px 0;

  }

  .theme-classic .faq-magazine-layout--with-image .faq-magazine-item--featured,

  .theme-elegant .faq-magazine-layout--with-image .faq-magazine-item--featured {

    grid-column: auto;

  }

  .theme-classic .faq-magazine-layout--with-image .faq-magazine-item:not(.faq-magazine-item--featured):nth-child(2n + 3),

  .theme-elegant .faq-magazine-layout--with-image .faq-magazine-item:not(.faq-magazine-item--featured):nth-child(2n + 3) {

    margin-top: 0;

  }

  @media (max-width: 768px) {

    .theme-classic .faq-section--with-image,

    .theme-elegant .faq-section--with-image {

      position: relative;

      width: 100%;

      background-image: var(--faq-section-bg-image);

      background-position: center;

      background-size: cover;

      background-repeat: no-repeat;

      padding: 40px 20px !important;

      overflow: hidden;

      isolation: isolate;

    }

    .theme-classic .faq-section--with-image::before,

    .theme-elegant .faq-section--with-image::before {

      content: '';

      position: absolute;

      inset: 0;

      z-index: 0;

      background: rgba(251, 249, 244, 0.85);

      backdrop-filter: blur(8px);

      -webkit-backdrop-filter: blur(8px);

      pointer-events: none;

    }

    .theme-elegant .faq-section--with-image::before {

      background: rgba(255, 255, 255, 0.88);

    }

    .theme-classic .faq-section--with-image > *,

    .theme-elegant .faq-section--with-image > * {

      position: relative;

      z-index: 1;

    }

    .theme-classic .faq-section--with-image .faq-magazine-layout--with-image,

    .theme-elegant .faq-section--with-image .faq-magazine-layout--with-image {

      display: block;

      width: 100%;

      gap: 0;

    }

    .theme-classic .faq-section--with-image .faq-magazine-feature,

    .theme-elegant .faq-section--with-image .faq-magazine-feature {

      display: none;

    }

    .theme-classic .faq-section--with-image .faq-magazine-wrap,

    .theme-elegant .faq-section--with-image .faq-magazine-wrap {

      padding-inline: 0;

      width: 100%;

    }

    .theme-classic .faq-section--with-image .faq-magazine-grid,

    .theme-elegant .faq-section--with-image .faq-magazine-grid {

      display: flex;

      flex-direction: column;

      gap: 50px;

      width: 100%;

    }

    .theme-classic .faq-section--with-image .faq-magazine-item,

    .theme-elegant .faq-section--with-image .faq-magazine-item,

    .theme-classic .faq-section--with-image .faq-magazine-item__question,

    .theme-elegant .faq-section--with-image .faq-magazine-item__question,

    .theme-classic .faq-section--with-image .faq-magazine-item__answer,

    .theme-elegant .faq-section--with-image .faq-magazine-item__answer {

      text-align: right;

    }

    .theme-classic .faq-magazine-layout--with-image,

    .theme-elegant .faq-magazine-layout--with-image {

      display: block;

      width: 100%;

      gap: 0;

    }

  }

  .theme-classic .faq-magazine-grid,

  .theme-elegant .faq-magazine-grid {

    display: grid;

    direction: rtl;

    grid-template-columns: 1fr;

    gap: 50px 60px;

    width: 100%;

    max-width: 100%;

    margin-inline: 0;

    padding: 0;

    box-sizing: border-box;

    background: transparent;

    border: none;

    box-shadow: none;

  }

  @media (min-width: 768px) {

    .theme-classic .faq-magazine-grid,

    .theme-elegant .faq-magazine-grid {

      grid-template-columns: repeat(2, minmax(0, 1fr));

    }

    .theme-classic .faq-magazine-item--featured,

    .theme-elegant .faq-magazine-item--featured {

      grid-column: 1 / -1;

    }

    .theme-classic .faq-magazine-item:not(.faq-magazine-item--featured):nth-child(2n + 3),

    .theme-elegant .faq-magazine-item:not(.faq-magazine-item--featured):nth-child(2n + 3) {

      margin-top: 2.5rem;

    }

  }

  .theme-classic .faq-magazine-item,

  .theme-elegant .faq-magazine-item {

    background: transparent;

    border: none;

    border-radius: 0;

    box-shadow: none;

    border-bottom: 1px solid rgba(0, 0, 0, 0.06);

    padding: 0 0 clamp(2rem, 4vw, 2.75rem);

    text-align: right;

    direction: rtl;

    display: flex;

    flex-direction: column;

    align-items: stretch;

    gap: 0.85rem;

    min-height: 0;

  }

  .theme-classic .faq-magazine-item__heading,

  .theme-elegant .faq-magazine-item__heading {

    display: flex;

    flex-direction: row;

    align-items: flex-start;

    justify-content: flex-start;

    gap: clamp(0.75rem, 2vw, 1.25rem);

    direction: rtl;

    text-align: right;

  }

  .theme-classic .faq-magazine-item__number,

  .theme-elegant .faq-magazine-item__number {

    color: transparent;

    -webkit-text-stroke: 1.5px ${primaryColor};

    paint-order: stroke fill;

    font-weight: 800;

    font-size: clamp(2rem, 5vw, 2.5rem);

    line-height: 1;

    flex-shrink: 0;

    font-variant-numeric: tabular-nums;

    letter-spacing: -0.02em;

    user-select: none;

  }

  .theme-classic .faq-magazine-item--featured .faq-magazine-item__number,

  .theme-elegant .faq-magazine-item--featured .faq-magazine-item__number {

    font-size: clamp(2.75rem, 6vw, 3.5rem);

  }

  .theme-elegant .faq-magazine-item__question {

    font-family: 'Heebo', sans-serif;

    font-size: clamp(1rem, 2.4vw, 1.125rem);

    font-weight: 400;

    line-height: 1.55;

    color: ${primaryColor};

    margin: 0;

    text-align: right;

    flex: 1;

  }

  .theme-elegant .faq-magazine-item--featured .faq-magazine-item__question {

    font-size: clamp(1.15rem, 2.8vw, 1.35rem);

  }

  .theme-elegant .faq-magazine-item__answer {

    font-family: 'Heebo', sans-serif;

    font-size: clamp(0.8125rem, 2.1vw, 0.975rem);

    font-weight: 300;

    line-height: 1.75;

    color: #0F0F0D;

    margin: 0;

    text-align: right;

    white-space: pre-line;

  }

  .theme-classic .faq-magazine-item__question {

    font-family: var(--headline-font, 'Heebo'), 'Heebo', sans-serif;

    font-size: clamp(1rem, 2.3vw, 1.2rem);

    font-weight: 600;

    line-height: 1.45;

    color: ${primaryColor};

    margin: 0;

    text-align: right;

    flex: 1;

  }

  .theme-classic .faq-magazine-item--featured .faq-magazine-item__question {

    font-size: clamp(1.2rem, 2.8vw, 1.45rem);

  }

  .theme-classic .faq-magazine-item__answer {

    font-family: 'Heebo', sans-serif;

    font-size: clamp(0.875rem, 2vw, 1rem);

    font-weight: 400;

    line-height: 1.7;

    color: #5a504a;

    margin: 0;

    text-align: right;

    white-space: pre-line;

  }`

}



export function elegantFaqSectionCss(primaryColor: string) {

  return `

  ${magazineFaqGridCss(primaryColor)}

  .faq-section__header,

  .testimonials-section__header {

    width: 100%;

    direction: ltr;

    text-align: left !important;

    margin-bottom: 1.25rem;

    padding-inline: 2%;

    box-sizing: border-box;

  }

  .faq-section__header .elegant-section-heading,

  .testimonials-section__header .elegant-section-heading {

    display: grid !important;

    width: 100%;

    max-width: 100%;

    justify-items: left !important;

    align-items: last baseline;

    text-align: left !important;

  }

  .faq-section__header .elegant-section-heading__watermark,

  .faq-section__header .elegant-section-heading__title,

  .testimonials-section__header .elegant-section-heading__watermark,

  .testimonials-section__header .elegant-section-heading__title {

    text-align: left !important;

    justify-self: left !important;

  }

  .faq-section__header .elegant-section-heading__title,

  .testimonials-section__header .elegant-section-heading__title {

    direction: rtl;

  }

  @media (max-width: 767px) {

    .faq-section__header .elegant-section-heading,

    .testimonials-section__header .elegant-section-heading {

      text-align: left !important;

      justify-items: left !important;

    }

    .faq-section__header .elegant-section-heading__watermark,

    .faq-section__header .elegant-section-heading__title,

    .testimonials-section__header .elegant-section-heading__watermark,

    .testimonials-section__header .elegant-section-heading__title {

      text-align: left !important;

      justify-self: left !important;

    }

  }

  .faq-section__subtitle {

    text-align: left !important;

    margin-top: 0.35rem;

    max-width: none;

  }`

}



export function classicFaqSectionCss(primaryColor: string) {

  return magazineFaqGridCss(primaryColor)

}



export const CLASSIC_CONTACT_FORM_CSS = `

  .theme-classic .classic-contact-layout {

    align-items: start;

  }

  .theme-classic .classic-contact-info {

    width: 100%;

    min-width: 0;

    text-align: right;

  }

  .theme-classic .classic-contact-info h2,

  .theme-classic .classic-contact-info p,

  .theme-classic .classic-contact-info > span {

    text-align: right;

  }

  .theme-classic .classic-contact-details {

    display: flex;

    flex-direction: column;

    gap: 1rem;

    width: 100%;

  }

  .theme-classic .classic-contact-details__link,
  .theme-classic .classic-contact-details__item {

    display: flex;

    align-items: center;

    gap: 0.75rem;

    width: 100%;

    min-width: 0;

  }

  .theme-classic .classic-contact-form {

    display: flex !important;

    flex-direction: column !important;

    align-items: stretch !important;

    width: 100%;

    min-width: 0;

  }

  .theme-classic .classic-contact-form > *:not(.contact-privacy-consent) {

    width: 100%;

    max-width: 100%;

    min-width: 0;

  }

  .theme-classic .classic-contact-form > .contact-privacy-consent {

    display: grid !important;

    grid-template-columns: auto 1fr !important;

    column-gap: 0.5rem;

    align-items: start !important;

    width: 100% !important;

    max-width: 100% !important;

    box-sizing: border-box;

  }

  .theme-classic .classic-contact-form .contact-privacy-checkbox {

    width: 1rem !important;

    height: 1rem !important;

    min-width: 1rem !important;

    min-height: 1rem !important;

    max-width: 1rem !important;

    max-height: 1rem !important;

    aspect-ratio: 1 / 1;

    flex-shrink: 0;

    margin-top: 0.2rem;

    border-radius: 2px;

    padding: 0;

    box-sizing: border-box;

    appearance: auto;

  }

  .theme-classic .classic-contact-form .contact-privacy-consent > p {

    flex: none !important;

    width: auto !important;

    max-width: 100% !important;

    min-width: 0;

    margin: 0;

    white-space: normal !important;

    word-break: normal !important;

    overflow-wrap: break-word;

  }

  .theme-classic .classic-contact-form .contact-privacy-consent label,
  .theme-classic .classic-contact-form .contact-privacy-consent a {

    display: inline !important;

    white-space: normal !important;

  }

  .theme-classic .classic-contact-form__message-block {

    display: flex !important;

    flex-direction: column !important;

    align-items: stretch !important;

    width: 100% !important;

    max-width: 100% !important;

    min-width: 0;

    margin-bottom: 1.5rem;

    overflow: visible !important;

  }

  .theme-classic .classic-contact-form__message-block > * {

    width: 100%;

    max-width: 100%;

    min-width: 0;

  }

  .theme-classic .classic-contact-form__row {

    display: grid;

    grid-template-columns: minmax(0, 1fr);

    gap: 1.5rem;

    width: 100%;

  }

  @media (min-width: 768px) {

    .theme-classic .classic-contact-form__row {

      grid-template-columns: repeat(2, minmax(0, 1fr));

    }

  }

  .theme-classic .classic-contact-field {

    display: flex;

    flex-direction: column;

    gap: 0.35rem;

    width: 100%;

    min-width: 0;

  }

  .theme-classic .classic-contact-field label {

    width: 100%;

  }

  .theme-classic .classic-contact-form input,
  .theme-classic .classic-contact-form textarea {

    width: 100%;

    min-width: 0;

    box-sizing: border-box;

  }

`



export const TESTIMONIAL_THUMB_CARD_CSS = `

  .testimonials-bleed {
    width: 100vw;
    max-width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    box-sizing: border-box;
  }

  .testimonials-section-grid:has(.testimonials-bleed) {
    padding-inline: 0;
  }

  .testimonials-marquee {
    overflow: hidden;
    position: relative;
    width: 100%;
    box-sizing: border-box;
    padding: 1rem 0;
    direction: ltr;
  }

  .testimonials-marquee-track {
    display: flex;
    flex-direction: row;
    direction: ltr;
    width: max-content;
    gap: 3rem;
    justify-content: flex-start;
    will-change: transform;
  }

  .testimonials-marquee-set {
    display: flex;
    flex-direction: row;
    flex: 0 0 auto;
    gap: 3rem;
    align-items: stretch;
  }

  .testimonials-marquee .testimonial-thumb-card {
    direction: rtl;
    flex: 0 0 auto;
  }

  .testimonials-marquee .reveal-on-scroll,
  .testimonials-marquee .animate-reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .testimonials-marquee-track,
    .testimonials-marquee-set {
      gap: 2.25rem;
    }
  }

  @media (max-width: 767px) {
    .testimonials-marquee-track,
    .testimonials-marquee-set {
      gap: 1.75rem;
    }
  }

  .testimonials-section--modern .testimonials-section-grid,
  .theme-bold .testimonials-section-grid {
    padding-top: 1rem;
    padding-bottom: 50px;
  }

  .testimonials-section--modern .testimonials-marquee,
  .theme-bold .testimonials-marquee {
    padding-top: 1rem;
    padding-bottom: 0;
  }

  .testimonials-section--modern .classic-testimonials-carousel,
  .theme-bold .classic-testimonials-carousel {
    padding-bottom: 0;
  }

  .testimonials-section {

    background: transparent !important;

    overflow: visible;

  }

  .testimonials-section-grid {

    display: flex;

    flex-wrap: wrap;

    gap: 2.25rem 2.75rem;

    justify-content: center;

    align-items: stretch;

    padding-top: 1rem;

    padding-bottom: 1.5rem;

    padding-inline: 1.25rem;

    overflow: visible;

  }

  .testimonials-row {

    display: flex;

    flex-wrap: wrap;

    gap: 2.25rem 2.75rem;

    justify-content: center;

    align-items: stretch;

    width: 100%;

  }

  .classic-testimonials-slide .testimonials-row {

    justify-content: center;

  }

  @media (max-width: 767px) {

    .classic-testimonials-carousel .testimonials-row {

      flex-wrap: wrap;

      gap: 1rem;

      justify-content: center;

    }

    .testimonials-section-grid > .testimonial-thumb-card,

    .testimonials-row > .testimonial-thumb-card {

      flex: 0 1 100%;

      max-width: 100%;

      width: 100%;

      min-width: 0;

    }

  }

  @media (min-width: 768px) and (max-width: 1023px) {

    .classic-testimonials-carousel .testimonials-row {

      flex-wrap: wrap;

      gap: 1.5rem;

      justify-content: center;

    }

    .testimonials-section-grid > .testimonial-thumb-card,

    .testimonials-row > .testimonial-thumb-card {

      flex: 0 1 calc(50% - 0.75rem);

      max-width: calc(50% - 0.75rem);

      width: calc(50% - 0.75rem);

      min-width: 0;

    }

    .testimonial-thumb-card {

      padding: 1.85rem 1.25rem 1.85rem 4.75rem;

    }

  }

  @media (min-width: 1024px) {

    .classic-testimonials-carousel .testimonials-row {

      flex-wrap: nowrap;

      gap: 2.5rem;

    }

    .testimonials-section-grid > .testimonial-thumb-card,

    .testimonials-row > .testimonial-thumb-card {

      flex: 0 1 calc((100% - 5.5rem) / 3);

      max-width: min(24rem, calc((100% - 5.5rem) / 3));

      width: auto;

      min-width: 0;

    }

  }

  .testimonial-thumb-card {

    position: relative;

    background: #ffffff;

    width: 100%;

    max-width: min(100%, 24rem);

    min-width: 14rem;

    min-height: 8.5rem;

    align-self: stretch;

    flex: 0 1 auto;

    display: flex;

    flex-direction: column;

    padding: 2.15rem 1.5rem 2.15rem 5.25rem;

    margin-top: 0.85rem;

    box-sizing: border-box;

  }

  .testimonial-thumb-card__quote {

    position: absolute;

    top: 0;

    right: 1.35rem;

    left: auto;

    transform: translateY(-50%);

    display: inline-flex;

    align-items: center;

    justify-content: center;

    background: #ffffff;

    padding: 0 0.75rem;

    line-height: 1;

    z-index: 3;

    opacity: 0.42;

    font-size: 2.35rem;

    pointer-events: none;

  }

  .testimonial-thumb-card__content {

    flex: 1;

    display: flex;

    flex-direction: column;

    justify-content: space-between;

    position: relative;

    z-index: 1;

    margin-top: 0.35rem;

    min-height: 0;

  }

  .testimonial-thumb-card__text {

    flex: 1 1 auto;

    width: 100%;

    overflow-wrap: break-word;

    word-wrap: break-word;

  }

  .testimonial-thumb-card__footer {

    margin-top: auto;

    flex-shrink: 0;

  }

  .testimonial-thumb-card__thumb {

    position: absolute;

    left: -1.15rem;

    bottom: -0.85rem;

    width: 4.5rem;

    height: 4.5rem;

    overflow: hidden;

    border: 3px solid #ffffff;

    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);

    z-index: 2;

    background: #f3f0ed;

  }

  .testimonial-thumb-card__thumb img {

    width: 100%;

    height: 100%;

    object-fit: cover;

    display: block;

  }

  .testimonial-thumb-card--classic {

    border-radius: 2px;

    box-shadow: 0 1px 3px rgba(45, 40, 37, 0.08);

    border: 1px solid rgba(121, 116, 126, 0.2);

  }

  .testimonial-thumb-card--elegant {

    border: 1px solid rgba(121, 116, 126, 0.35);

  }

  .testimonial-thumb-card--modern {

    border-radius: 1rem;

    border: 1px solid rgba(121, 116, 126, 0.25);

    box-shadow: 0 10px 30px rgba(45, 40, 37, 0.08);

  }

  .testimonial-thumb-card--dark {

    background: #1c1c26;

    border: 1px solid rgba(255, 255, 255, 0.07);

    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.38);

    color: rgba(255, 255, 255, 0.92);

  }

  .testimonial-thumb-card--dark .testimonial-thumb-card__quote {

    background: #1c1c26;

    opacity: 0.88;

    font-size: 2.85rem;

  }

  .testimonial-thumb-card--dark .testimonial-thumb-card__thumb {

    border-color: #1c1c26;

    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);

    background: #12121b;

  }

  .testimonial-thumb-card--dark .text-on-surface,

  .testimonial-thumb-card--dark .text-on-surface-variant {

    color: rgba(255, 255, 255, 0.9);

  }

  .testimonial-thumb-card--dark .text-on-surface-variant {

    opacity: 0.62;

  }

  .classic-testimonials-carousel {

    overflow: hidden;

    width: 100%;

    padding-bottom: 1rem;

  }

  .classic-testimonials-track {

    display: flex;

    transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);

    direction: ltr;

  }

  .classic-testimonials-slide {

    flex: 0 0 100%;

    width: 100%;

    box-sizing: border-box;

    direction: rtl;

  }

  .classic-testimonials-dots {

    display: flex;

    justify-content: center;

    align-items: center;

    gap: 0.5rem;

    margin-top: 2rem;

  }

  .classic-testimonials-dot {

    width: 8px;

    height: 8px;

    border-radius: 9999px;

    background: rgba(45, 40, 37, 0.22);

    border: none;

    padding: 0;

    cursor: pointer;

    transition: all 0.35s ease;

  }

  .classic-testimonials-dot.is-active {

    width: 28px;

    background: rgba(45, 40, 37, 0.55);

  }

`



export const TESTIMONIALS_MARQUEE_INIT_SCRIPT = `
(function initTestimonialsMarquee() {
  // Mirrors the modern hero film belt: measure the real pixel width of one card
  // set and drive the loop via the Web Animations API. No CSS percentages / vw /
  // RTL-anchoring, so the strip never empties or jumps at the seam.
  var SPEED_PX_PER_SEC = 55;

  function setup(container) {
    var track = container.querySelector('.testimonials-marquee-track');
    if (!track) return;
    var sets = track.querySelectorAll('.testimonials-marquee-set');
    if (sets.length < 2) return;
    var dup = sets[1];

    // Container width comes from CSS (94vw bleed wrapper). No JS viewport breakout.
    var containerWidth = Math.round(container.getBoundingClientRect().width);
    if (!containerWidth) return;

    var visibleW = document.documentElement.clientWidth || window.innerWidth;
    var perView = visibleW >= 1024 ? 3 : (visibleW >= 768 ? 2 : 1);
    var gapPx = visibleW >= 1024 ? 48 : (visibleW >= 768 ? 36 : 28);

    var uniqueCards = sets[0].querySelectorAll('.testimonial-thumb-card');
    var allCards = track.querySelectorAll('.testimonial-thumb-card');
    var unique = uniqueCards.length;

    // Only scroll when there are more testimonials than fit in one view.
    var willScroll = unique > perView;

    // Uniform card width so exactly perView cards fill the container width
    // (3 on desktop, 2 on tablet, 1 on mobile). Same sizing in both modes so a
    // static row looks identical to a scrolling one, just centered.
    var cardW = Math.floor((containerWidth - (perView - 1) * gapPx) / perView);
    var maxCardW = 384; // 24rem — same fixed max width as modern theme
    if (cardW > maxCardW) cardW = maxCardW;
    allCards.forEach(function (c) {
      c.style.width = cardW + 'px';
      c.style.minWidth = cardW + 'px';
      c.style.maxWidth = cardW + 'px';
      c.style.flex = '0 0 ' + cardW + 'px';
    });

    sets[0].style.marginLeft = '';
    sets[0].style.marginRight = '';

    if (!willScroll) {
      // Not enough testimonials for a belt -> one static, centered row, no motion.
      if (track.__mqAnim) { try { track.__mqAnim.cancel(); } catch (e) {} track.__mqAnim = null; }
      track.__mqShift = 0;
      track.__mqLayoutKey = '';
      dup.style.display = 'none';
      track.style.width = '100%';
      track.style.justifyContent = 'center';
      track.style.transform = 'none';
      sets[0].style.marginLeft = 'auto';
      sets[0].style.marginRight = 'auto';
      return;
    }

    dup.style.display = 'flex';
    track.style.width = '';
    track.style.justifyContent = '';
    track.style.transform = '';

    // Compute shift mathematically (one full set + track gap). Measuring
    // getBoundingClientRect between sets was unreliable on desktop and returned
    // 0, which skipped the animation entirely and left cards stuck on the left.
    var trackGap = parseFloat(getComputedStyle(track).gap);
    if (isNaN(trackGap)) trackGap = gapPx;
    var shift = unique * cardW + Math.max(0, unique - 1) * gapPx + Math.round(trackGap);
    if (shift < 1) return;

    var layoutKey = unique + 'x' + perView + 'x' + cardW;
    if (track.__mqAnim && track.__mqLayoutKey === layoutKey) {
      return;
    }
    track.__mqLayoutKey = layoutKey;
    track.__mqShift = shift;

    if (track.__mqAnim) { try { track.__mqAnim.cancel(); } catch (e) {} track.__mqAnim = null; }
    if (typeof track.animate !== 'function') return;

    var duration = (shift / SPEED_PX_PER_SEC) * 1000;
    track.__mqAnim = track.animate(
      [
        { transform: 'translate3d(0px, 0, 0)' },
        { transform: 'translate3d(' + (-shift) + 'px, 0, 0)' }
      ],
      { duration: duration, iterations: Infinity, easing: 'linear' }
    );
  }

  function setupAll() {
    document.querySelectorAll('[data-testimonials-marquee]').forEach(setup);
  }

  function boot() {
    setupAll();

    // All repeated triggers funnel through one debounce so we never thrash the
    // animation (which would freeze it). Card widths are fixed pixels, so the
    // measured shift is stable across image/font loads and the guard keeps the
    // single running animation alive.
    var t;
    function schedule() {
      clearTimeout(t);
      t = setTimeout(setupAll, 150);
    }

    window.addEventListener('load', schedule);
    window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(schedule).catch(function () {});
    }
    document.querySelectorAll('[data-testimonials-marquee] img').forEach(function (img) {
      if (img.complete) return;
      img.addEventListener('load', schedule, { once: true });
      img.addEventListener('error', schedule, { once: true });
    });
    if (typeof ResizeObserver !== 'undefined') {
      document.querySelectorAll('[data-testimonials-marquee]').forEach(function (container) {
        new ResizeObserver(schedule).observe(container);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`

export const TESTIMONIALS_CAROUSEL_INIT_SCRIPT = `
(function initTestimonialsCarousel() {
  var carousel = document.getElementById('testimonials-carousel');
  if (!carousel) return;
  var track = carousel.querySelector('.classic-testimonials-track');
  var dots = carousel.querySelectorAll('.classic-testimonials-dot');
  var slides = carousel.querySelectorAll('.classic-testimonials-slide');
  if (!track || slides.length <= 1) return;

  function isDesktop() {
    return window.innerWidth >= 1024;
  }

  if (!isDesktop()) {
    track.style.transform = 'none';
    slides.forEach(function(slide) {
      slide.style.flex = '0 0 auto';
      slide.style.width = '100%';
    });
    dots.forEach(function(dot) {
      dot.style.display = 'none';
    });
    return;
  }

  var index = 0;
  var timer;
  function goTo(i) {
    index = ((i % slides.length) + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    dots.forEach(function(dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === index);
    });
  }
  function next() { goTo(index + 1); }
  function resetTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, 5000);
  }
  dots.forEach(function(dot, dotIndex) {
    dot.addEventListener('click', function() {
      goTo(dotIndex);
      resetTimer();
    });
  });
  goTo(0);
  resetTimer();

  window.addEventListener('resize', function() {
    if (!isDesktop()) {
      track.style.transform = 'none';
      slides.forEach(function(slide) {
        slide.style.flex = '0 0 auto';
        slide.style.width = '100%';
      });
      dots.forEach(function(dot) {
        dot.style.display = 'none';
      });
      if (timer) clearInterval(timer);
    } else {
      dots.forEach(function(dot) {
        dot.style.display = '';
      });
      goTo(0);
      resetTimer();
    }
  });
})();
`

export const TESTIMONIALS_EQUAL_HEIGHT_SCRIPT = `

(function() {

  function equalizeTestimonialHeights() {

    var section = document.getElementById('testimonials');

    if (!section) return;

    var cards = section.querySelectorAll('.testimonial-thumb-card');

    if (!cards.length) return;

    for (var i = 0; i < cards.length; i++) {

      cards[i].style.minHeight = '';

    }

    var max = 0;

    for (var j = 0; j < cards.length; j++) {

      var h = cards[j].getBoundingClientRect().height;

      if (h > max) max = h;

    }

    max = Math.ceil(max);

    for (var k = 0; k < cards.length; k++) {

      cards[k].style.minHeight = max + 'px';

    }

  }

  var resizeTimer;

  function scheduleEqualize() {

    if (resizeTimer) clearTimeout(resizeTimer);

    resizeTimer = setTimeout(equalizeTestimonialHeights, 120);

  }

  window.addEventListener('load', equalizeTestimonialHeights);

  window.addEventListener('resize', scheduleEqualize);

  if (document.fonts && document.fonts.ready) {

    document.fonts.ready.then(equalizeTestimonialHeights);

  }

})();

`



