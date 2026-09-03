import { ApplicationConfig, inject, Injectable, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

/** Met à jour le titre du navigateur : "Nom de la page | Cathéo CIM" */
@Injectable()
class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    // Parcourt l'arbre des routes activées pour trouver le titre le plus profond
    let route = snapshot.root;
    let pageTitle: string | undefined;

    while (route) {
      if (route.data?.['title']) {
        pageTitle = route.data['title'] as string;
      }
      route = route.firstChild!;
    }

    this.title.setTitle(
      pageTitle ? `${pageTitle} | Cathéo CIM` : 'Cathéo CIM'
    );
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: TitleStrategy, useClass: AppTitleStrategy }
  ]
};
