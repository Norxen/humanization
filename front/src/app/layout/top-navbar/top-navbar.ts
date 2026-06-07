import { Component, input, output } from '@angular/core';
import { Theme } from '../../core/services/theme.service';

@Component({
  selector: 'app-top-navbar',
  templateUrl: './top-navbar.html',
  styleUrl: './top-navbar.css'
})
export class TopNavbar {
  readonly theme = input.required<Theme>();
  readonly menuToggle = output<void>();
  readonly themeToggle = output<void>();
}
