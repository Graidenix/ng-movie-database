import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '@core/i18n/language.service';
import { SeoService } from '@core/seo/seo.service';
import { Icon } from '@shared/icon/icon';
import { Logo } from '@shared/logo/logo';

/** Unknown URLs. The server answers with HTTP 404 (see app.routes.server.ts). */
@Component({
  selector: 'app-not-found-page',
  imports: [Icon, Logo, RouterLink],
  template: `
    <section
      data-testid="not-found"
      class="page-container flex min-h-[60vh] flex-col items-start justify-center gap-6 pt-10 sm:pt-32"
    >
      <app-logo class="h-12 text-seam" />
      <p class="font-display text-6xl text-marquee sm:text-8xl" aria-hidden="true">404</p>
      <h1 class="font-display text-3xl text-balance sm:text-5xl">{{ t().notFoundTitle }}</h1>
      <p class="max-w-xl text-lg text-dim">{{ t().notFoundText }}</p>
      <a
        routerLink="/"
        data-testid="not-found-home"
        class="inline-flex h-12 items-center gap-2 rounded-full bg-marquee px-6 font-semibold text-ink transition-[scale,filter] hover:brightness-110 active:scale-95"
      >
        {{ t().notFoundAction }}
        <app-icon name="arrow-right" class="size-5" />
      </a>
    </section>
  `,
})
export class NotFoundPage {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  protected readonly t = inject(LanguageService).t;

  constructor() {
    effect(() => {
      const t = this.t();
      this.seo.update({
        title: `${t.notFoundTitle} — ${t.appName}`,
        description: t.notFoundText,
        path: this.router.url.split(/[?#]/)[0],
        noindex: true,
      });
    });
  }
}
