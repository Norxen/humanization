import { Component, input, output } from '@angular/core';
import { Theme } from '../../core/services/theme.service';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-top-navbar',
  templateUrl: './top-navbar.html',
  styleUrl: './top-navbar.css'
})
export class TopNavbar {
  readonly theme = input.required<Theme>();
  readonly userEmail = input<string | null>(null);
  readonly authReady = input(false);
  readonly canChangePassword = input(false);
  readonly projectName = input('Projects');
  readonly showBack = input(false);
  readonly canManageProject = input(false);
  readonly projectOptions = input<Project[]>([]);
  readonly activeProjectId = input<string | null>(null);
  readonly menuToggle = output<void>();
  readonly themeToggle = output<void>();
  readonly login = output<void>();
  readonly passwordChange = output<void>();
  readonly logout = output<void>();
  readonly back = output<void>();
  readonly projectSettings = output<void>();
  readonly projectSelected = output<Project>();
}
