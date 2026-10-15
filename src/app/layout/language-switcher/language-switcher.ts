import { Component, inject } from '@angular/core';
import { LanguageService } from '@core/i18n/language.service';
import { LANGUAGES, Language, TRANSLATIONS } from '@core/i18n/translations';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
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
