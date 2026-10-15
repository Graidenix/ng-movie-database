import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/movies/movie-list-page').then((m) => m.MovieListPage),
  },
  {
    path: 'movie/:id',
    loadComponent: () =>
      import('@features/movies/movie-detail-page').then((m) => m.MovieDetailPage),
  },
  { path: '**', redirectTo: '' },
];
