import { DOCUMENT, Service, inject } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { LanguageService } from '@core/i18n/language.service';

/** Production origin; canonical and social URLs always point here. */
export const SITE_URL = 'https://movie-database.odajiu.eu';

const DESCRIPTION_MAX_LENGTH = 160;
const JSON_LD_ID = 'structured-data';

export interface PageSeo {
  title: string;
  description: string;
  /** Path of the canonical URL, e.g. `/movie/603`. */
  path: string;
  /** Absolute image URL for social previews. */
  image?: string | null;
  type?: 'website' | 'video.movie';
  /** Keeps the page out of search results (search results, errors). */
  noindex?: boolean;
  /** schema.org structured data. */
  jsonLd?: object | null;
}

/**
 * Sets the document title, meta description, robots, canonical link, Open Graph / Twitter tags
 * and JSON-LD for the current page. Runs during SSR, so crawlers and link previews get them.
 */
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
      { name: 'twitter:card', content: page.image ? 'summary_large_image' : 'summary' },
      { name: 'twitter:title', content: page.title },
      { name: 'twitter:description', content: description },
    ]);

    if (page.image) {
      this.setTags([
        { property: 'og:image', content: page.image },
        { name: 'twitter:image', content: page.image },
      ]);
    } else {
      this.meta.removeTag('property="og:image"');
      this.meta.removeTag('name="twitter:image"');
    }

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
    // Escape "<" so movie text can never close the script element.
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }
}

/** Cuts text at a word boundary so it fits search result snippets. */
export function truncate(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) {
    return clean;
  }
  const cut = clean.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:]+$/, '')}…`;
}
