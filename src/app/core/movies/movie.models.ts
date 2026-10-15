export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime: number | null;
  tagline: string | null;
  vote_count: number;
}

export interface PagedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface GenreMovies extends PagedResponse<Movie> {
  genre: Genre;
}

export type LoadError =
  'network' | 'notFound' | 'genreNotFound' | 'server' | 'rateLimited' | 'queryTooLong';
