import { Component, inject } from '@angular/core';
import { LanguageService } from '@core/i18n/language.service';
import { LANGUAGES, Language, TRANSLATIONS } from '@core/i18n/translations';

@Component({
  selector: 'app-language-switcher',
  template: `
    <div
      role="group"
      [attr.aria-label]="t().languageSwitcherLabel"
      class="flex rounded-md border border-edge p-1"
    >
      @for (option of options; track option.code) {
        <button
          type="button"
          [attr.lang]="option.code"
          [attr.aria-label]="option.name"
          [attr.aria-pressed]="option.code === language()"
          class="h-9 min-w-11 cursor-pointer rounded px-3 text-sm font-semibold text-dim transition-colors hover:text-screen aria-pressed:bg-marquee aria-pressed:text-ink"
          (click)="select(option.code)"
        >
          {{ option.code.toUpperCase() }}
        </button>
      }
    </div>
  `,
})
export class LanguageSwitcher {
  private readonly languageService = inject(LanguageService);

  protected readonly t = this.languageService.t;
  protected readonly language = this.languageService.language;
  protected readonly options = LANGUAGES.map((code) => ({
    code,
    name: TRANSLATIONS[code].languageName,
  }));

  protected select(language: Language): void {
    this.languageService.setLanguage(language);
  }
}
