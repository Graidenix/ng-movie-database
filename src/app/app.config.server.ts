import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { INTERNAL_API_TOKEN } from '@core/http/internal-api.interceptor';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: INTERNAL_API_TOKEN, useFactory: () => process.env['INTERNAL_API_TOKEN'] ?? null },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
