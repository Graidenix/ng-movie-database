export const LANGUAGES = ['en', 'ru'] as const;
export type Language = (typeof LANGUAGES)[number];

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}

export interface Translations {
  appName: string;
  languageName: string;
  languageSwitcherLabel: string;
  skipToContent: string;
  searchHeadline: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchButton: string;
  popularHeading: string;
  resultsHeading: (query: string) => string;
  resultsCount: (count: number) => string;
  loading: string;
  loadMore: string;
  noResultsTitle: (query: string) => string;
  noResultsHint: string;
  showPopular: string;
  retry: string;
  errors: Record<'network' | 'notFound' | 'server', string>;
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

const en: Translations = {
  appName: 'Movie Database',
  languageName: 'English',
  languageSwitcherLabel: 'Language',
  skipToContent: 'Skip to main content',
  searchHeadline: 'Find a film',
  searchLabel: 'Movie title',
  searchPlaceholder: 'Try “Arrival” or “Amélie”',
  searchButton: 'Search',
  popularHeading: 'Popular right now',
  resultsHeading: (query) => `Results for “${query}”`,
  resultsCount: (count) => `${count} ${count === 1 ? 'movie' : 'movies'} shown`,
  loading: 'Loading movies',
  loadMore: 'Show more movies',
  noResultsTitle: (query) => `Nothing matches “${query}”`,
  noResultsHint: 'Check the spelling, or search by the original title.',
  showPopular: 'Show popular movies',
  retry: 'Try again',
  errors: {
    network: 'Can’t reach the server. Check your connection and try again.',
    notFound: 'This movie isn’t in the database.',
    server: 'The movie service didn’t respond. Try again in a moment.',
  },
  noPoster: 'No poster',
  back: 'Back',
  overview: 'Overview',
  noOverview: 'No description yet.',
  releaseDate: 'Release date',
  rating: 'Rating',
  votes: (count) => `${count} ${count === 1 ? 'vote' : 'votes'}`,
  runtime: 'Runtime',
  minutes: (count) => `${count} min`,
  genres: 'Genres',
  unknown: 'Unknown',
  tmdbAttribution: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
};

function ruPlural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const ru: Translations = {
  appName: 'База фильмов',
  languageName: 'Русский',
  languageSwitcherLabel: 'Язык',
  skipToContent: 'Перейти к содержимому',
  searchHeadline: 'Найдите фильм',
  searchLabel: 'Название фильма',
  searchPlaceholder: 'Например, «Прибытие» или «Амели»',
  searchButton: 'Найти',
  popularHeading: 'Популярное сейчас',
  resultsHeading: (query) => `Результаты по запросу «${query}»`,
  resultsCount: (count) => `Показано ${count} ${ruPlural(count, 'фильм', 'фильма', 'фильмов')}`,
  loading: 'Загружаем фильмы',
  loadMore: 'Показать ещё',
  noResultsTitle: (query) => `По запросу «${query}» ничего нет`,
  noResultsHint: 'Проверьте написание или введите оригинальное название.',
  showPopular: 'Показать популярные фильмы',
  retry: 'Повторить',
  errors: {
    network: 'Нет связи с сервером. Проверьте подключение и повторите попытку.',
    notFound: 'Такого фильма нет в базе.',
    server: 'Сервис фильмов не ответил. Повторите попытку чуть позже.',
  },
  noPoster: 'Нет постера',
  back: 'Назад',
  overview: 'Описание',
  noOverview: 'Описания пока нет.',
  releaseDate: 'Дата выхода',
  rating: 'Рейтинг',
  votes: (count) => `${count} ${ruPlural(count, 'голос', 'голоса', 'голосов')}`,
  runtime: 'Длительность',
  minutes: (count) => `${count} мин`,
  genres: 'Жанры',
  unknown: 'Неизвестно',
  tmdbAttribution: 'Этот продукт использует TMDB API, но не одобрен и не сертифицирован TMDB.',
};

export const TRANSLATIONS: Record<Language, Translations> = { en, ru };
