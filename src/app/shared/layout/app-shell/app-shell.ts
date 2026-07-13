import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Icon } from '../../ui/icon/icon';
import { Avatar } from '../../ui/avatar/avatar';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';
import { NavItem } from '../nav-item.model';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon, Avatar, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly router = inject(Router);

  readonly navItems = input.required<NavItem[]>();
  readonly brandName = input<string>('EduSync');
  readonly portalLabel = input<string>('');
  readonly useBottomNav = input<boolean>(false);
  readonly logoSrc = input<string>('assets/edusync-logo.png');

  readonly sidebarOpen = signal(false);
  readonly user = this.auth.currentUser;
  readonly bottomNavItems = () => this.navItems().slice(0, 5);

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  logout(): void {
    this.auth.logout();
    this.teacherService.clearSelectedSubject();
    this.router.navigate(['/login']);
  }
}
