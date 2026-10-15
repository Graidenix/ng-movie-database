import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/movies/movie-list-page/movie-list-page').then((m) => m.MovieListPage),
  },
  {
    path: 'movie/:id',
    loadComponent: () =>
      import('@features/movies/movie-detail-page/movie-detail-page').then((m) => m.MovieDetailPage),
  },
  {
    path: '**',
    loadComponent: () =>
      import('@features/not-found/not-found-page/not-found-page').then((m) => m.NotFoundPage),
  },
];
