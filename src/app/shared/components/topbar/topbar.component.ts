import { Component, EventEmitter, Output, inject } from '@angular/core';

import { KeycloakService } from '../../../core/auth/keycloak.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  protected keycloak = inject(KeycloakService);
  protected theme = inject(ThemeService);
}
