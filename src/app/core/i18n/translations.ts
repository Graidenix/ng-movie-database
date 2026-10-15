import { MAX_SEARCH_QUERY_LENGTH } from '@api/movies/_lib/limits';
import { LoadError } from '@core/movies/movie.models';

export const LANGUAGES = ['en', 'ru'] as const;
export type Language = (typeof LANGUAGES)[number];

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}

export interface MovieFacts {
  genres: string[];
  year?: string;
  minutes?: number | null;
  /** Already formatted for the language, e.g. "8.2" / "8,2". */
  rating?: string;
}

function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export interface Translations {
  appName: string;
  seoDescription: string;
  /** Leading facts for a movie's meta description, e.g. "Drama · 1999 · 136 min · rated 8.2/10." */
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

const en: Translations = {
  appName: 'Movie Database',
  seoDescription:
    'Find what to watch next: this week’s trending and most popular movies with ratings, genres, runtimes and release dates. Search any film by title.',
  movieFacts: ({ genres, year, minutes, rating }) =>
    capitalize(
      [genres.join(', '), year, minutes && `${minutes} min`, rating && `rated ${rating}/10`]
        .filter(Boolean)
        .join(' · '),
    ),
  notFoundTitle: 'Page not found',
  notFoundText:
    'This page doesn’t exist or has moved. Browse what’s popular, or search for a movie from the top bar.',
  notFoundAction: 'Browse popular movies',
  languageName: 'English',
  languageSwitcherLabel: 'Language',
  skipToContent: 'Skip to main content',
  searchLabel: 'Movie title',
  searchPlaceholder: 'Try “Arrival” or “Amélie”',
  searchButton: 'Search',
  searchShort: 'Search movies',
  viewDetails: 'View details',
  trendingHeading: 'Trending this week',
  slideLabel: (position, total) => `${position} of ${total}`,
  goToSlide: (position, title) => `Show slide ${position}: ${title}`,
  pauseSlideshow: 'Pause slideshow',
  playSlideshow: 'Play slideshow',
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
    rateLimited: 'Too many requests in a short time. Wait a minute, then try again.',
    queryTooLong: `Search text is too long. Use up to ${MAX_SEARCH_QUERY_LENGTH} characters.`,
  },
  searchTooLong: `Use up to ${MAX_SEARCH_QUERY_LENGTH} characters.`,
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
  seoDescription:
    'Что посмотреть: трендовые и самые популярные фильмы недели с рейтингами, жанрами, длительностью и датами выхода. Поиск любого фильма по названию.',
  movieFacts: ({ genres, year, minutes, rating }) =>
    capitalize(
      [genres.join(', '), year, minutes && `${minutes} мин`, rating && `рейтинг ${rating}/10`]
        .filter(Boolean)
        .join(' · '),
    ),
  notFoundTitle: 'Страница не найдена',
  notFoundText:
    'Такой страницы нет или она переехала. Посмотрите популярные фильмы или найдите фильм через поиск вверху.',
  notFoundAction: 'Популярные фильмы',
  languageName: 'Русский',
  languageSwitcherLabel: 'Язык',
  skipToContent: 'Перейти к содержимому',
  searchLabel: 'Название фильма',
  searchPlaceholder: 'Например, «Прибытие» или «Амели»',
  searchButton: 'Найти',
  searchShort: 'Поиск фильмов',
  viewDetails: 'Подробнее',
  trendingHeading: 'В тренде на этой неделе',
  slideLabel: (position, total) => `${position} из ${total}`,
  goToSlide: (position, title) => `Показать слайд ${position}: ${title}`,
  pauseSlideshow: 'Остановить слайд-шоу',
  playSlideshow: 'Запустить слайд-шоу',
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
    rateLimited: 'Слишком много запросов за короткое время. Подождите минуту и повторите.',
    queryTooLong: `Слишком длинный запрос. Используйте не больше ${MAX_SEARCH_QUERY_LENGTH} символов.`,
  },
  searchTooLong: `Не больше ${MAX_SEARCH_QUERY_LENGTH} символов.`,
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
