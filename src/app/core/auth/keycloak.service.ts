import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private keycloak: Keycloak;

  constructor() {
    this.keycloak = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId
    });
  }

  init(): Promise<boolean> {
    return this.keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: false
    });
  }

  getToken(): Promise<string> {
    return this.keycloak.updateToken(30).then(() => this.keycloak.token ?? '');
  }

  logout(): void {
    this.keycloak.logout({ redirectUri: window.location.origin });
  }

  getUsername(): string {
    return this.keycloak.tokenParsed?.['preferred_username'] ?? '';
  }

  hasRole(role: string): boolean {
    return this.keycloak.hasRealmRole(role);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isAuthenticated(): boolean {
    return !!this.keycloak.authenticated;
  }
}
