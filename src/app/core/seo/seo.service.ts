import { DOCUMENT, Service, inject } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { LanguageService } from '@core/i18n/language.service';

export const SITE_URL = 'https://movie-database.odajiu.eu';

const DESCRIPTION_MAX_LENGTH = 160;

export interface SeoImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

const JSON_LD_ID = 'structured-data';

export const DEFAULT_SEO_IMAGE: Omit<SeoImage, 'alt'> = {
  url: `${SITE_URL}/og-image.jpg`,
  width: 1200,
  height: 630,
};

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  image?: SeoImage | null;
  type?: 'website' | 'video.movie';
  noindex?: boolean;
  jsonLd?: object | null;
}

@Service()
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly languageService = inject(LanguageService);

  update(page: PageSeo): void {
    const url = SITE_URL + page.path;
    const description = truncate(page.description, DESCRIPTION_MAX_LENGTH);
    const t = this.languageService.t();

    this.title.setTitle(page.title);
    this.setTags([
      { name: 'description', content: description },
      { name: 'robots', content: page.noindex ? 'noindex, follow' : 'index, follow' },
      { property: 'og:site_name', content: t.appName },
      { property: 'og:type', content: page.type ?? 'website' },
      { property: 'og:title', content: page.title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      {
        property: 'og:locale',
        content: this.languageService.language() === 'ru' ? 'ru_RU' : 'en_US',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: page.title },
      { name: 'twitter:description', content: description },
    ]);

    const image = page.image ?? { ...DEFAULT_SEO_IMAGE, alt: t.appName };
    this.setTags([
      { property: 'og:image', content: image.url },
      { property: 'og:image:width', content: String(image.width) },
      { property: 'og:image:height', content: String(image.height) },
      { property: 'og:image:alt', content: image.alt },
      { name: 'twitter:image', content: image.url },
      { name: 'twitter:image:alt', content: image.alt },
    ]);

    this.setCanonical(url);
    this.setJsonLd(page.jsonLd ?? null);
  }

  private setTags(tags: MetaDefinition[]): void {
    for (const tag of tags) {
      const selector = tag.property ? `property="${tag.property}"` : `name="${tag.name}"`;
      this.meta.updateTag(tag, selector);
    }
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private setJsonLd(data: object | null): void {
    let script = this.document.getElementById(JSON_LD_ID);
    if (!data) {
      script?.remove();
      return;
    }
    if (!script) {
      script = this.document.createElement('script');
      script.id = JSON_LD_ID;
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    // a movie overview containing </script> must not end the tag
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }
}

export function truncate(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) {
    return clean;
  }
  const cut = clean.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:]+$/, '')}…`;
}
