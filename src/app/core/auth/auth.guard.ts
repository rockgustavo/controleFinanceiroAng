import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { KeycloakService } from './keycloak.service';

export const adminGuard: CanActivateFn = () => {
  const keycloak = inject(KeycloakService);
  return keycloak.isAdmin();
};
