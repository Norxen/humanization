import { Component, input, output } from '@angular/core';
import { Theme } from '../../core/services/theme.service';

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
  readonly menuToggle = output<void>();
  readonly themeToggle = output<void>();
  readonly login = output<void>();
  readonly passwordChange = output<void>();
  readonly logout = output<void>();
}
