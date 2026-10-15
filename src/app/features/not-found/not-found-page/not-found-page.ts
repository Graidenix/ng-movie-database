import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '@core/i18n/language.service';
import { SeoService } from '@core/seo/seo.service';
import { Icon } from '@shared/icon/icon';
import { Logo } from '@shared/logo/logo';

@Component({
  selector: 'app-not-found-page',
  imports: [Icon, Logo, RouterLink],
  templateUrl: './not-found-page.html',
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
