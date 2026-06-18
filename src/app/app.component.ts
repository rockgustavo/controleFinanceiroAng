import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { TopbarComponent } from './shared/components/topbar/topbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, BottomNavComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  protected readonly collapsed = signal(localStorage.getItem('sidebar') === 'collapsed');

  protected toggleSidebar(): void {
    this.collapsed.update(value => {
      const next = !value;
      localStorage.setItem('sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  }
}
