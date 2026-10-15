import { IMAGE_CONFIG, IMAGE_LOADER, registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import localeRu from '@angular/common/locales/ru';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { TMDB_IMAGE_BREAKPOINTS, tmdbImageLoader } from '@core/movies/tmdb-image-loader';
import { routes } from './app.routes';

registerLocaleData(localeRu);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      // Poster morphs between list and details (see PosterTransition); no-op where unsupported.
      withViewTransitions({ skipInitialTransition: true }),
    ),
    // Hydration includes the HTTP transfer cache: GET responses fetched during SSR are reused
    // by the browser instead of being requested again.
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    { provide: IMAGE_LOADER, useValue: tmdbImageLoader },
    { provide: IMAGE_CONFIG, useValue: { breakpoints: TMDB_IMAGE_BREAKPOINTS } },
  ],
};
