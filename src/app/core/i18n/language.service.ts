import {
  DOCUMENT,
  REQUEST,
  Service,
  TransferState,
  computed,
  effect,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
import { Language, TRANSLATIONS, isLanguage } from './translations';

const COOKIE_NAME = 'lang';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
/** Language the server rendered with, so hydration starts from the same one. */
const RENDERED_LANGUAGE = makeStateKey<Language>('renderedLanguage');

/** Holds the active UI language and its translations. */
@Service()
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly transferState = inject(TransferState);

  private readonly languageState = signal<Language>(this.detectLanguage());
  readonly language = this.languageState.asReadonly();
  readonly t = computed(() => TRANSLATIONS[this.languageState()]);

  constructor() {
    this.transferState.set(RENDERED_LANGUAGE, this.languageState());
    effect(() => {
      this.document.documentElement.lang = this.languageState();
    });
  }

  setLanguage(language: Language): void {
    this.languageState.set(language);
    this.document.cookie =
      `${COOKIE_NAME}=${language}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  }

  /**
   * Server: `lang` cookie, then `Accept-Language`.
   * Browser: the language the server rendered with, then the cookie, then `navigator.language`.
   */
  private detectLanguage(): Language {
    if (this.request) {
      return (
        readCookie(this.request.headers.get('cookie')) ??
        fromLocale(this.request.headers.get('accept-language'))
      );
    }
    const rendered = this.transferState.get(RENDERED_LANGUAGE, null);
    if (isLanguage(rendered)) {
      return rendered;
    }
    return (
      readCookie(this.document.cookie) ?? fromLocale(this.document.defaultView?.navigator.language)
    );
  }
}

function readCookie(cookieHeader: string | null | undefined): Language | null {
  const value = cookieHeader
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === COOKIE_NAME)?.[1];
  return isLanguage(value) ? value : null;
}

/** Picks Russian when the first preferred locale is Russian; English otherwise. */
function fromLocale(locale: string | null | undefined): Language {
  return locale?.trim().toLowerCase().startsWith('ru') ? 'ru' : 'en';
}
