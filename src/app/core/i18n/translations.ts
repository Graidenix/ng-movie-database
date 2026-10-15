import { MAX_SEARCH_QUERY_LENGTH } from '@api/movies/_lib/limits';
import { LoadError } from '@core/movies/movie.models';
import enMessages from './locales/en.json';
import ruMessages from './locales/ru.json';

export const LANGUAGES = ['en', 'ru'] as const;
export type Language = (typeof LANGUAGES)[number];

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}

export interface MovieFacts {
  genres: string[];
  year?: string;
  minutes?: number | null;
  rating?: string;
}

export interface Translations {
  appName: string;
  seoDescription: string;
  movieFacts: (facts: MovieFacts) => string;
  notFoundTitle: string;
  notFoundText: string;
  notFoundAction: string;
  languageName: string;
  languageSwitcherLabel: string;
  skipToContent: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchButton: string;
  searchShort: string;
  viewDetails: string;
  trendingHeading: string;
  slideLabel: (position: number, total: number) => string;
  goToSlide: (position: number, title: string) => string;
  pauseSlideshow: string;
  playSlideshow: string;
  popularHeading: string;
  resultsHeading: (query: string) => string;
  resultsCount: (count: number) => string;
  loading: string;
  loadMore: string;
  noResultsTitle: (query: string) => string;
  noResultsHint: string;
  showPopular: string;
  retry: string;
  errors: Record<LoadError, string>;
  searchTooLong: string;
  noPoster: string;
  back: string;
  overview: string;
  noOverview: string;
  releaseDate: string;
  rating: string;
  votes: (count: number) => string;
  runtime: string;
  minutes: (count: number) => string;
  genres: string;
  unknown: string;
  tmdbAttribution: string;
}

// Plural forms are keyed by Intl.PluralRules categories: en uses one/other, ru one/few/many.
type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>>;

// Shape of locales/*.json. Templates use {name} placeholders.
interface Messages {
  appName: string;
  seoDescription: string;
  movieFactsRating: string;
  notFoundTitle: string;
  notFoundText: string;
  notFoundAction: string;
  languageName: string;
  languageSwitcherLabel: string;
  skipToContent: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchButton: string;
  searchShort: string;
  viewDetails: string;
  trendingHeading: string;
  slideLabel: string;
  goToSlide: string;
  pauseSlideshow: string;
  playSlideshow: string;
  popularHeading: string;
  resultsHeading: string;
  resultsCount: PluralForms;
  loading: string;
  loadMore: string;
  noResultsTitle: string;
  noResultsHint: string;
  showPopular: string;
  retry: string;
  errors: Record<LoadError, string>;
  searchTooLong: string;
  noPoster: string;
  back: string;
  overview: string;
  noOverview: string;
  releaseDate: string;
  rating: string;
  votes: PluralForms;
  runtime: string;
  minutes: string;
  genres: string;
  unknown: string;
  tmdbAttribution: string;
}

type Params = Record<string, string | number>;

export function format(template: string, params: Params): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}

export function plural(language: Language, forms: PluralForms, count: number): string {
  const category = new Intl.PluralRules(language).select(count);
  return format(forms[category] ?? forms.other ?? '', { count });
}

function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function translations(language: Language, m: Messages): Translations {
  const minutes = (count: number) => format(m.minutes, { count });
  const max = { max: MAX_SEARCH_QUERY_LENGTH };

  return {
    appName: m.appName,
    seoDescription: m.seoDescription,
    movieFacts: ({ genres, year, minutes: runtime, rating }) =>
      capitalize(
        [
          genres.join(', '),
          year,
          runtime && minutes(runtime),
          rating && format(m.movieFactsRating, { rating }),
        ]
          .filter(Boolean)
          .join(' · '),
      ),
    notFoundTitle: m.notFoundTitle,
    notFoundText: m.notFoundText,
    notFoundAction: m.notFoundAction,
    languageName: m.languageName,
    languageSwitcherLabel: m.languageSwitcherLabel,
    skipToContent: m.skipToContent,
    searchLabel: m.searchLabel,
    searchPlaceholder: m.searchPlaceholder,
    searchButton: m.searchButton,
    searchShort: m.searchShort,
    viewDetails: m.viewDetails,
    trendingHeading: m.trendingHeading,
    slideLabel: (position, total) => format(m.slideLabel, { position, total }),
    goToSlide: (position, title) => format(m.goToSlide, { position, title }),
    pauseSlideshow: m.pauseSlideshow,
    playSlideshow: m.playSlideshow,
    popularHeading: m.popularHeading,
    resultsHeading: (query) => format(m.resultsHeading, { query }),
    resultsCount: (count) => plural(language, m.resultsCount, count),
    loading: m.loading,
    loadMore: m.loadMore,
    noResultsTitle: (query) => format(m.noResultsTitle, { query }),
    noResultsHint: m.noResultsHint,
    showPopular: m.showPopular,
    retry: m.retry,
    errors: { ...m.errors, queryTooLong: format(m.errors.queryTooLong, max) },
    searchTooLong: format(m.searchTooLong, max),
    noPoster: m.noPoster,
    back: m.back,
    overview: m.overview,
    noOverview: m.noOverview,
    releaseDate: m.releaseDate,
    rating: m.rating,
    votes: (count) => plural(language, m.votes, count),
    runtime: m.runtime,
    minutes,
    genres: m.genres,
    unknown: m.unknown,
    tmdbAttribution: m.tmdbAttribution,
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: translations('en', enMessages),
  ru: translations('ru', ruMessages),
};
