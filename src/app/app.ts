import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>

    <div class="star-field"></div>

    <header class="app-header">
      <div class="header-inner">
        <a routerLink="/" class="logo" aria-label="Space Dashboard Home">
          <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
            <circle cx="16" cy="16" r="8" fill="#7c5cfc" opacity="0.3"/>
            <circle cx="16" cy="16" r="5" fill="#7c5cfc"/>
            <circle cx="16" cy="16" r="12" fill="none" stroke="#00d4ff" stroke-width="1" opacity="0.4"
                    stroke-dasharray="3 5" transform="rotate(30 16 16)"/>
            <circle cx="25" cy="10" r="2" fill="#ffd700" opacity="0.6"/>
          </svg>
          <span class="logo-text">Space</span>
        </a>

        <nav class="header-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Dashboard</a>
          <a routerLink="/asteroids" routerLinkActive="active">Asteroids</a>
          <a routerLink="/mars" routerLinkActive="active">Mars</a>
          <a routerLink="/gallery" routerLinkActive="active">Gallery</a>
          <a routerLink="/launches" routerLinkActive="active">Launches</a>
          <a routerLink="/satellites" routerLinkActive="active">Satellites</a>
        </nav>
      </div>
    </header>

    <main id="main-content">
      <router-outlet />
    </main>

    <footer class="app-footer">
      <p>Powered by <a href="https://api.nasa.gov/" target="_blank" rel="noopener">NASA Open APIs</a> &
        <a href="http://open-notify.org/" target="_blank" rel="noopener">Open Notify</a></p>
      <div class="footer-links">
        <a href="https://corvid-agent.github.io/" target="_blank" rel="noopener">Home</a>
        <a href="https://corvid-agent.github.io/weather-dashboard/" target="_blank" rel="noopener">Weather</a>
        <a href="https://corvid-agent.github.io/bw-cinema/" target="_blank" rel="noopener">Cinema</a>
        <a href="https://corvid-agent.github.io/retro-arcade/" target="_blank" rel="noopener">Arcade</a>
      </div>
    </footer>

    <!-- Mobile bottom nav -->
    <nav class="bottom-nav" aria-label="Mobile navigation">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        <span>Home</span>
      </a>
      <a routerLink="/asteroids" routerLinkActive="active">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M19.07 4.93l-2.83 2.83M7.76 16.24l-2.83 2.83"/></svg>
        <span>NEOs</span>
      </a>
      <a routerLink="/mars" routerLinkActive="active">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12a4 4 0 018 0"/></svg>
        <span>Mars</span>
      </a>
      <a routerLink="/gallery" routerLinkActive="active">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        <span>Gallery</span>
      </a>
      <a routerLink="/launches" routerLinkActive="active">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
        <span>Launches</span>
      </a>
      <a routerLink="/satellites" routerLinkActive="active">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M4.93 4.93l4.24 4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M14.83 9.17l4.24-4.24"/><path d="M4.93 19.07l4.24-4.24"/></svg>
        <span>Satellites</span>
      </a>
    </nav>
  `,
  styles: [`
    .app-header {
      position: sticky; top: 0; z-index: 50;
      background: rgba(5, 5, 16, 0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      height: var(--header-height);
    }
    .header-inner {
      max-width: var(--max-width); margin: 0 auto;
      padding: 0 var(--space-lg); height: 100%;
      display: flex; align-items: center; gap: var(--space-lg);
    }
    .logo {
      display: flex; align-items: center; gap: var(--space-sm);
      color: var(--text-primary);
      font-family: var(--font-heading);
      font-weight: 700; font-size: 1.1rem;
      flex-shrink: 0;
    }
    .logo:hover { color: var(--accent-nebula); }
    .logo-text { white-space: nowrap; }
    .header-nav {
      display: flex; align-items: center; gap: var(--space-xs);
      margin-left: auto;
    }
    .header-nav a {
      padding: var(--space-sm) var(--space-md); min-height: 44px;
      display: inline-flex; align-items: center;
      border-radius: var(--radius);
      color: var(--text-secondary);
      font-size: 0.9rem; font-weight: 500;
      transition: background 0.2s, color 0.2s;
    }
    .header-nav a:hover { background: var(--bg-hover); color: var(--text-primary); }
    .header-nav a.active { color: var(--accent-nebula); background: var(--accent-nebula-dim); }
    main {
      min-height: calc(100vh - var(--header-height) - 60px);
      padding-bottom: 0;
    }
    .app-footer {
      text-align: center; padding: var(--space-lg);
      color: var(--text-tertiary); font-size: 0.875rem;
    }
    .app-footer a { color: var(--accent-nebula); }
    .footer-links {
      display: flex; justify-content: center; gap: var(--space-md);
      margin-top: var(--space-xs); font-size: 0.875rem;
    }
    .footer-links a { color: var(--text-secondary); transition: color 0.2s; }
    .footer-links a:hover { color: var(--accent-nebula); }

    .bottom-nav {
      display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
      background: rgba(5, 5, 16, 0.95);
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid var(--border);
      padding: var(--space-xs) 0;
      padding-bottom: max(var(--space-xs), env(safe-area-inset-bottom));
    }
    .bottom-nav a {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: var(--space-sm) 0; min-height: 44px; min-width: 44px;
      color: var(--text-tertiary); justify-content: center;
      font-size: 0.75rem; font-weight: 500; transition: color 0.2s;
    }
    .bottom-nav a.active { color: var(--accent-nebula); }
    .bottom-nav a:hover { color: var(--text-primary); }

    @media (max-width: 640px) {
      .header-inner { padding: 0 var(--space-md); gap: var(--space-sm); }
      .logo-text { display: none; }
      .header-nav { display: none; }
      .bottom-nav { display: flex; justify-content: space-around; }
      main { padding-bottom: 72px; }
      .app-footer { padding-bottom: 80px; }
    }
  `],
})
export class App {}
